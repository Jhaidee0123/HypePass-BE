export enum TicketStatus {
    ISSUED = 'issued',
    LISTED = 'listed',
    RESERVED_FOR_RESALE = 'reserved_for_resale',
    TRANSFERRED = 'transferred',
    CHECKED_IN = 'checked_in',
    REFUNDED = 'refunded',
    VOIDED = 'voided',
    EXPIRED = 'expired',
}

export const OWNABLE_TICKET_STATUSES: TicketStatus[] = [
    TicketStatus.ISSUED,
    TicketStatus.LISTED,
    TicketStatus.RESERVED_FOR_RESALE,
];
