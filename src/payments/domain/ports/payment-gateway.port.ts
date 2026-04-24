/**
 * Provider-agnostic contract so the checkout flow doesn't depend on Wompi
 * directly. Swap out the Wompi adapter for another provider by binding this
 * token to a different implementation.
 */
export abstract class PaymentGatewayPort {
    abstract getPublicKey(): string;
    /** Returns a checkout integrity signature for reference/amount/currency. */
    abstract generateSignature(
        reference: string,
        amountInCents: number,
        currency: string,
    ): string;
    /** Verifies the webhook payload is authentic (HMAC check). */
    abstract verifyWebhookSignature(payload: any): boolean;
    /** Fetch a single transaction from the provider by id. */
    abstract getTransaction(transactionId: string): Promise<any>;
    /** Fetch the most recent transaction by our own reference. */
    abstract getTransactionByReference(reference: string): Promise<any>;
}
