import { PaymentGatewayName } from '../types/payment-gateway-name';

/**
 * Optional context passed to gateway methods that need per-merchant
 * credentials or marketplace fee splitting (e.g. MercadoPago Split).
 * Wompi adapter ignores it. MercadoPago adapter requires `companyId`
 * to resolve the seller's access_token.
 */
export type GatewayContext = {
    companyId?: string;
    /** Application fee in cents the marketplace charges on this payment.
     *  Only honored by split-capable gateways (MercadoPago). */
    applicationFeeAmount?: number;
};

/**
 * Provider-agnostic contract so the checkout flow doesn't depend on Wompi
 * directly. Each adapter declares its `name` so the registry can look it
 * up by company preference.
 *
 * Methods are async because some adapters (MP) need an HTTP roundtrip to
 * create a preference. Sync adapters (Wompi) wrap in Promise.resolve().
 */
export abstract class PaymentGatewayPort {
    abstract readonly name: PaymentGatewayName;

    abstract getPublicKey(ctx?: GatewayContext): Promise<string>;

    /** Returns either a checkout integrity signature (Wompi) or an
     *  opaque token / preference id (MercadoPago). The FE uses
     *  whichever the gateway returned. */
    abstract generateSignature(
        reference: string,
        amountInCents: number,
        currency: string,
        ctx?: GatewayContext,
    ): Promise<string>;

    /** Verifies the webhook payload is authentic (HMAC check). */
    abstract verifyWebhookSignature(payload: any): boolean;

    /** Fetch a single transaction from the provider by id. */
    abstract getTransaction(
        transactionId: string,
        ctx?: GatewayContext,
    ): Promise<any>;

    /** Fetch the most recent transaction by our own reference. */
    abstract getTransactionByReference(
        reference: string,
        ctx?: GatewayContext,
    ): Promise<any>;
}
