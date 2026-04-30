import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { PaymentGatewayName } from '../../domain/types/payment-gateway-name';

/**
 * Wompi REST + webhook adapter. Mirrors the production integration in
 * HotCaps-Nest-APP — we use the same signature/verification scheme.
 *
 * Wompi does NOT support marketplace split — `GatewayContext` is ignored.
 * For split, see MercadoPagoService.
 */
@Injectable()
export class WompiService extends PaymentGatewayPort {
    readonly name: PaymentGatewayName = 'wompi';
    private readonly logger = new Logger(WompiService.name);
    private readonly publicKey: string;
    private readonly privateKey: string;
    private readonly integritySecret: string;
    private readonly eventsSecret: string;
    private readonly apiUrl: string;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
    ) {
        super();
        this.publicKey = this.config.get<string>('WOMPI_PUBLIC_KEY')!;
        this.privateKey = this.config.get<string>('WOMPI_PRIVATE_KEY')!;
        this.integritySecret = this.config.get<string>(
            'WOMPI_INTEGRITY_SECRET',
        )!;
        this.eventsSecret = this.config.get<string>('WOMPI_EVENTS_SECRET')!;
        this.apiUrl = this.config.get<string>('WOMPI_API_URL')!;
    }

    async getPublicKey(): Promise<string> {
        return this.publicKey;
    }

    async generateSignature(
        reference: string,
        amountInCents: number,
        currency: string,
    ): Promise<string> {
        const raw = `${reference}${amountInCents}${currency}${this.integritySecret}`;
        return createHash('sha256').update(raw).digest('hex');
    }

    verifyWebhookSignature(payload: any): boolean {
        const { signature, timestamp } = payload ?? {};
        if (!signature?.checksum || !signature?.properties || !timestamp) {
            this.logger.warn('Wompi webhook: missing signature fields');
            return false;
        }
        const properties: string[] = signature.properties;
        const values = properties.map((prop: string) => {
            const keys = prop.split('.');
            let value: any = payload.data;
            for (const key of keys) value = value?.[key];
            return value;
        });
        const raw = values.join('') + timestamp + this.eventsSecret;
        const computed = createHash('sha256').update(raw).digest('hex');
        if (computed !== signature.checksum) {
            this.logger.warn(
                `Wompi webhook signature mismatch — computed=${computed} expected=${signature.checksum}`,
            );
        }
        return computed === signature.checksum;
    }

    async getTransaction(transactionId: string): Promise<any> {
        const response = await firstValueFrom(
            this.http.get(`${this.apiUrl}/transactions/${transactionId}`, {
                headers: { Authorization: `Bearer ${this.privateKey}` },
            }),
        );
        return response.data?.data;
    }

    async getTransactionByReference(reference: string): Promise<any> {
        this.logger.log(`Wompi lookup by reference: ${reference}`);
        const response = await firstValueFrom(
            this.http.get(`${this.apiUrl}/transactions`, {
                params: { reference },
                headers: { Authorization: `Bearer ${this.privateKey}` },
            }),
        );
        const transactions = response.data?.data;
        return Array.isArray(transactions) && transactions.length > 0
            ? transactions[0]
            : null;
    }
}
