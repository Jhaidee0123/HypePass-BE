export enum PayoutRecordStatus {
    PENDING = 'pending',
    /**
     * Settled (buyer paid, ticket transferred) but the escrow window hasn't
     * elapsed yet. A sweeper promotes to PAYABLE once the event ends + the
     * configured hold buffer. Blocks admin from dispersing funds too early.
     */
    PENDING_EVENT = 'pending_event',
    PAYABLE = 'payable',
    PAID = 'paid',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum PayoutTransactionType {
    RESELLER_PAYOUT = 'reseller_payout',
    ORGANIZER_SALE_SETTLEMENT = 'organizer_sale_settlement',
    REFUND = 'refund',
}
