import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
    GatewayContext,
    PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';
import { PaymentGatewayName } from '../../domain/types/payment-gateway-name';
import { CompanyPaymentGatewayCredentialService } from '../../application/services/company-payment-gateway-credential.service';
import { CryptoService } from '../../../shared/infrastructure/services/crypto.service';

/**
 * MercadoPago Split Payments adapter.
 *
 * Each call requires a `companyId` in `GatewayContext` so we can resolve
 * the seller's encrypted access_token. HypePass receives its commission
 * via the `marketplace_fee` field (a.k.a. `application_fee_amount`).
 *
 * Flag-gated by `MERCADOPAGO_ENABLED`. While disabled, all methods throw
 * an explicit error — useful to surface misconfiguration loudly during
 * dev rather than silently routing to the wrong adapter.
 *
 * MP authentication for marketplace requests uses the SELLER's
 * access_token (obtained via OAuth, see `MercadoPagoOAuthService`).
 */
@Injectable()
export class MercadoPagoService extends PaymentGatewayPort {
    readonly name: PaymentGatewayName = 'mercadopago';
    private readonly logger = new Logger(MercadoPagoService.name);
    private readonly apiUrl: string;
    private readonly platformAccessToken: string;
    private readonly platformPublicKey: string;
    private readonly webhookSecret: string;
    readonly enabled: boolean;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private readonly creds: CompanyPaymentGatewayCredentialService,
        private readonly crypto: CryptoService,
    ) {
        super();
        this.apiUrl = this.config.get<string>(
            'MERCADOPAGO_API_URL',
            'https://api.mercadopago.com',
        );
        this.platformAccessToken = this.config.get<string>(
            'MERCADOPAGO_ACCESS_TOKEN',
            '',
        );
        this.platformPublicKey = this.config.get<string>(
            'MERCADOPAGO_PUBLIC_KEY',
            '',
        );
        this.webhookSecret = this.config.get<string>(
            'MERCADOPAGO_WEBHOOK_SECRET',
            '',
        );
        const flag = this.config.get<string>('MERCADOPAGO_ENABLED', 'false');
        this.enabled = flag === 'true' || flag === '1';
    }

    private async resolveSellerAccessToken(
        companyId: string,
    ): Promise<string> {
        const cred = await this.creds.findOne(companyId, 'mercadopago');
        if (!cred || !cred.isActive || !cred.mpAccessTokenEnc) {
            throw new Error(
                `Company ${companyId} has no active MercadoPago credentials`,
            );
        }
        const token = this.crypto.decryptOrNull(cred.mpAccessTokenEnc);
        if (!token) {
            throw new Error(
                `Company ${companyId} MP access_token could not be decrypted`,
            );
        }
        // TODO: if cred.mpTokenExpiresAt is near, refresh via OAuth refresh
        // before returning. For MVP we trust the 180-day window.
        return token;
    }

    /**
     * Returns the SELLER's public key — the FE uses it to load MP's
     * checkout SDK in the seller's context. Different from the
     * platform's public key.
     */
    async getPublicKey(ctx?: GatewayContext): Promise<string> {
        if (!this.enabled) {
            throw new Error('MercadoPago is not enabled');
        }
        if (!ctx?.companyId) {
            // No company → return platform public key for non-marketplace
            // flows (admin testing). Production checkouts always pass
            // companyId.
            return this.platformPublicKey;
        }
        const cred = await this.creds.findOne(ctx.companyId, 'mercadopago');
        if (!cred?.mpPublicKey) {
            throw new Error(
                `Company ${ctx.companyId} has no MP public_key — connect their account first`,
            );
        }
        return cred.mpPublicKey;
    }

    /**
     * Creates a checkout `preference` with `marketplace_fee` set so MP
     * splits the payment automatically. Returns the preference id, which
     * the FE feeds into MP's checkout brick.
     *
     * The "signature" semantic here is reused from Wompi: a string the
     * FE needs to start the payment. For MP it's literally the
     * preference id, not a hash.
     */
    async generateSignature(
        reference: string,
        amountInCents: number,
        currency: string,
        ctx?: GatewayContext,
    ): Promise<string> {
        if (!this.enabled) {
            throw new Error('MercadoPago is not enabled');
        }
        if (!ctx?.companyId) {
            throw new Error(
                'MercadoPago.generateSignature requires ctx.companyId',
            );
        }
        const sellerToken = await this.resolveSellerAccessToken(ctx.companyId);
        const amountInUnits = amountInCents / 100;
        const marketplaceFee = ctx.applicationFeeAmount
            ? ctx.applicationFeeAmount / 100
            : 0;

        const body = {
            external_reference: reference,
            items: [
                {
                    title: `HypePass — ${reference}`,
                    quantity: 1,
                    currency_id: currency,
                    unit_price: amountInUnits,
                },
            ],
            marketplace_fee: marketplaceFee,
            // notification_url + back_urls are configured per-app at the
            // MP dashboard or per-call. Keeping it global for MVP.
            notification_url: `${this.config.get<string>('APP_URL', '')}/api/checkout/mp-webhook`,
        };

        try {
            const response = await firstValueFrom(
                this.http.post(`${this.apiUrl}/checkout/preferences`, body, {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json',
                    },
                }),
            );
            const id: string | undefined = response.data?.id;
            if (!id) {
                throw new Error('MP returned a preference without id');
            }
            return id;
        } catch (err: any) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            this.logger.error(
                `MP /checkout/preferences failed (${status}): ${JSON.stringify(body)}`,
            );
            throw new Error(
                `MercadoPago preference creation failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }

    /**
     * MP webhooks are signed with HMAC-SHA256 of `id:<x>;request-id:<y>;ts:<z>`
     * using `webhookSecret`. The signature arrives in the
     * `x-signature` header, formatted as `ts=...,v1=...`.
     */
    verifyWebhookSignature(payload: any): boolean {
        if (!this.webhookSecret) return false;
        const header: string | undefined = payload?.headers?.['x-signature'];
        const requestId: string | undefined =
            payload?.headers?.['x-request-id'];
        const dataId =
            payload?.body?.data?.id ?? payload?.query?.['data.id'] ?? '';
        if (!header || !requestId) return false;

        const parts = header.split(',');
        const tsPart = parts.find((p) => p.trim().startsWith('ts='));
        const v1Part = parts.find((p) => p.trim().startsWith('v1='));
        if (!tsPart || !v1Part) return false;
        const ts = tsPart.split('=')[1];
        const expected = v1Part.split('=')[1];

        const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
        const computed = createHmac('sha256', this.webhookSecret)
            .update(manifest)
            .digest('hex');

        const a = Buffer.from(computed);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    }

    /** Fetch a payment by id using the seller's access_token. */
    async getTransaction(
        transactionId: string,
        ctx?: GatewayContext,
    ): Promise<any> {
        if (!ctx?.companyId) {
            throw new Error(
                'MercadoPago.getTransaction requires ctx.companyId',
            );
        }
        const sellerToken = await this.resolveSellerAccessToken(ctx.companyId);
        const response = await firstValueFrom(
            this.http.get(`${this.apiUrl}/v1/payments/${transactionId}`, {
                headers: { Authorization: `Bearer ${sellerToken}` },
            }),
        );
        return response.data;
    }

    /** Lookup a payment by external_reference. */
    async getTransactionByReference(
        reference: string,
        ctx?: GatewayContext,
    ): Promise<any> {
        if (!ctx?.companyId) {
            throw new Error(
                'MercadoPago.getTransactionByReference requires ctx.companyId',
            );
        }
        const sellerToken = await this.resolveSellerAccessToken(ctx.companyId);
        const response = await firstValueFrom(
            this.http.get(`${this.apiUrl}/v1/payments/search`, {
                params: { external_reference: reference },
                headers: { Authorization: `Bearer ${sellerToken}` },
            }),
        );
        const results = response.data?.results;
        return Array.isArray(results) && results.length > 0 ? results[0] : null;
    }
}
