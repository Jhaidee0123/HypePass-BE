export enum OrderStatus {
    PENDING = 'pending',
    AWAITING_PAYMENT = 'awaiting_payment',
    PAID = 'paid',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

export const FINAL_ORDER_STATUSES: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.FAILED,
    OrderStatus.CANCELLED,
    OrderStatus.EXPIRED,
    OrderStatus.REFUNDED,
];

export enum OrderType {
    PRIMARY = 'primary',
    RESALE = 'resale',
    COURTESY = 'courtesy',
}
