import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Wompi "Pagos a Terceros" (SPT / Payouts) adapter. Used by the
 * `DispersePayoutUseCase` to disperse organizer-sale settlements and
 * resale-seller payouts to a Colombian bank account.
 *
 * NOTE: requires Wompi's Payouts product activation, which is separate
 * from the standard payment-gateway product. The credentials below are
 * NOT the same as `WOMPI_PRIVATE_KEY` — they come from a different
 * product in the Wompi dashboard.
 *
 * Feature-flagged via `WOMPI_PAYOUTS_ENABLED`. When false, the service
 * loads but the sweeper short-circuits — useful to deploy code before
 * Wompi activates the product.
 */

export type WompiBankRow = {
    id: string;
    name: string;
};

export type WompiAccountType = 'AHORROS' | 'CORRIENTE';

export type WompiLegalIdType = 'CC' | 'CE' | 'NIT' | 'PP' | 'TI';

export type WompiPayoutPaymentType =
    | 'PAYROLL'
    | 'PROVIDERS'
    | 'OTHER';

export type DispersePayoutInput = {
    amountInCents: number;
    currency: string;
    reference: string;
    /** Recipient bank details */
    bankId: string;
    accountType: WompiAccountType;
    accountNumber: string;
    legalIdType: WompiLegalIdType;
    legalIdNumber: string;
    holderName: string;
    holderEmail: string;
    /** What kind of payment is this in Wompi's books. Default OTHER. */
    paymentType?: WompiPayoutPaymentType;
};

export type DispersePayoutResult =
    | {
          ok: true;
          payoutId: string;
          status: 'PENDING' | 'APPROVED';
          rawResponse: any;
      }
    | {
          ok: false;
          reason: string;
          rawResponse?: any;
      };

@Injectable()
export class WompiPayoutsService {
    private readonly logger = new Logger(WompiPayoutsService.name);
    private readonly apiUrl: string;
    private readonly privateKey: string;
    private readonly originAccountId: string;
    readonly enabled: boolean;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
    ) {
        this.apiUrl = this.config.get<string>(
            'WOMPI_PAYOUTS_API_URL',
            'https://api.wompi.co/v1',
        );
        this.privateKey = this.config.get<string>(
            'WOMPI_PAYOUTS_PRIVATE_KEY',
            '',
        );
        this.originAccountId = this.config.get<string>(
            'WOMPI_PAYOUTS_ORIGIN_ACCOUNT_ID',
            '',
        );
        const flag = this.config.get<string>('WOMPI_PAYOUTS_ENABLED', 'false');
        this.enabled = flag === 'true' || flag === '1';
    }

    private authHeaders() {
        return { Authorization: `Bearer ${this.privateKey}` };
    }

    /**
     * Lookup of Colombian banks supported by Wompi for payouts. Cache the
     * result in-memory for 24h since the list is stable. Caller must use
     * `id` (UUID) when creating a payout.
     */
    private banksCache: { rows: WompiBankRow[]; ts: number } | null = null;
    async listBanks(): Promise<WompiBankRow[]> {
        const now = Date.now();
        if (
            this.banksCache &&
            now - this.banksCache.ts < 24 * 60 * 60 * 1000
        ) {
            return this.banksCache.rows;
        }
        try {
            const response = await firstValueFrom(
                this.http.get(`${this.apiUrl}/banks`, {
                    headers: this.authHeaders(),
                }),
            );
            const rows: WompiBankRow[] = (response.data?.data ?? []).map(
                (b: any) => ({ id: b.id, name: b.name }),
            );
            this.banksCache = { rows, ts: now };
            return rows;
        } catch (err: any) {
            this.logger.error(
                `Wompi /banks failed: ${err?.message ?? 'unknown'}`,
            );
            // Don't poison the cache; let the next call retry.
            return this.banksCache?.rows ?? [];
        }
    }

    /**
     * Disperse one payment to a single recipient. Returns ok=true with
     * payoutId on success, ok=false with reason on any failure (network,
     * 4xx, 5xx). Never throws — the caller decides how to mark the
     * PayoutRecord based on the result.
     */
    async dispersePayment(
        input: DispersePayoutInput,
    ): Promise<DispersePayoutResult> {
        if (!this.enabled) {
            return {
                ok: false,
                reason:
                    'Wompi Payouts is not enabled (WOMPI_PAYOUTS_ENABLED=false)',
            };
        }
        if (!this.privateKey || !this.originAccountId) {
            return {
                ok: false,
                reason: 'Wompi Payouts credentials are missing',
            };
        }

        const body = {
            amount_in_cents: Math.round(input.amountInCents),
            currency: input.currency || 'COP',
            reference: input.reference,
            origin_account_id: this.originAccountId,
            payment_type: input.paymentType ?? 'OTHER',
            recipient: {
                legal_id_type: input.legalIdType,
                legal_id: input.legalIdNumber,
                bank_id: input.bankId,
                account_type: input.accountType,
                account_number: input.accountNumber,
                full_name: input.holderName,
                email: input.holderEmail,
            },
        };

        try {
            const response = await firstValueFrom(
                this.http.post(`${this.apiUrl}/payouts`, body, {
                    headers: this.authHeaders(),
                }),
            );
            const data = response.data?.data;
            if (!data?.id) {
                return {
                    ok: false,
                    reason: 'Wompi accepted the payout but returned no id',
                    rawResponse: response.data,
                };
            }
            return {
                ok: true,
                payoutId: data.id,
                status: data.status ?? 'PENDING',
                rawResponse: data,
            };
        } catch (err: any) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            const reason =
                body?.error?.reason ||
                body?.error?.messages ||
                body?.error?.message ||
                err?.message ||
                'unknown';
            this.logger.error(
                `Wompi /payouts failed (${status}): ${JSON.stringify(reason)}`,
            );
            return {
                ok: false,
                reason: typeof reason === 'string' ? reason : JSON.stringify(reason),
                rawResponse: body,
            };
        }
    }

    /**
     * Get the latest status for a payout. Used to reconcile pending
     * dispersions. Returns null if not found / unreachable.
     */
    async getPayoutStatus(
        payoutId: string,
    ): Promise<{ status: string; raw: any } | null> {
        if (!this.enabled || !this.privateKey) return null;
        try {
            const response = await firstValueFrom(
                this.http.get(`${this.apiUrl}/payouts/${payoutId}`, {
                    headers: this.authHeaders(),
                }),
            );
            const data = response.data?.data;
            if (!data) return null;
            return { status: data.status, raw: data };
        } catch (err: any) {
            this.logger.warn(
                `Wompi /payouts/${payoutId} lookup failed: ${err?.message ?? 'unknown'}`,
            );
            return null;
        }
    }
}
