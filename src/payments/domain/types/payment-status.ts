export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    CHARGEBACK = 'chargeback',
    UNKNOWN = 'unknown',
}

export const FINAL_PAYMENT_STATUSES: PaymentStatus[] = [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
    PaymentStatus.CHARGEBACK,
];
