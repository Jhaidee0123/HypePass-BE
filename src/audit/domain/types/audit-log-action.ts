/**
 * Stable action identifiers used in audit_logs.action. Typed union keeps
 * writes honest — new actions must be declared here first.
 */
export type AuditLogAction =
    | 'company.approved'
    | 'company.rejected'
    | 'company.suspended'
    | 'company.reinstated'
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
    | 'staff.revoked'
    | 'user.role_changed'
    | 'user.banned'
    | 'user.unbanned'
    | 'user.deleted'
    | 'user.password_reset_sent'
    | 'platform_setting.updated'
    | 'promoter.assigned'
    | 'promoter.revoked';

export type AuditActorKind = 'user' | 'system';
