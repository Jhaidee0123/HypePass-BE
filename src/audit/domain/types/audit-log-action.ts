/**
 * Stable action identifiers used in audit_logs.action. Typed union keeps
 * writes honest — new actions must be declared here first.
 */
export type AuditLogAction =
    | 'company.approved'
    | 'company.rejected'
    | 'event.approved'
    | 'event.rejected'
    | 'event.published'
    | 'event.unpublished'
    | 'event.rotate_qr'
    | 'payout.marked_paid'
    | 'payout.marked_failed'
    | 'payout.cancelled'
    | 'order.marked_reconciled'
    | 'courtesy.issued'
    | 'staff.assigned'
    | 'staff.revoked';

export type AuditActorKind = 'user' | 'system';
