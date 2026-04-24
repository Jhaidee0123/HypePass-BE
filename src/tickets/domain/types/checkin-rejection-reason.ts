export enum CheckinResult {
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export enum CheckinRejectionReason {
    INVALID_TOKEN = 'invalid_token',
    TOKEN_EXPIRED = 'token_expired',
    TAMPERED_TOKEN = 'tampered_token',
    WRONG_EVENT = 'wrong_event',
    WRONG_SESSION = 'wrong_session',
    ALREADY_CHECKED_IN = 'already_checked_in',
    TICKET_REFUNDED = 'ticket_refunded',
    TICKET_VOIDED = 'ticket_voided',
    TICKET_TRANSFERRED = 'ticket_transferred',
    TICKET_LISTED = 'ticket_listed',
    SESSION_NOT_OPEN = 'session_not_open',
    QR_NOT_YET_VALID = 'qr_not_yet_valid',
    TICKET_NOT_FOUND = 'ticket_not_found',
    STALE_TOKEN = 'stale_token',
}
