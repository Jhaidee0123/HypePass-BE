/**
 * Stable action identifiers used in audit_logs.action. Typed union keeps
 * writes honest — new actions must be declared here first.
 */
export type AuditLogAction =
    | 'company.approved'
    | 'company.rejected'
    | 'company.suspended'
    | 'company.reinstated'
    | 'company.deleted'
    | 'event.approved'
    | 'event.rejected'
    | 'event.published'
    | 'event.unpublished'
    | 'event.rotate_qr'
    | 'event.deleted'
    | 'payout.marked_paid'
    | 'payout.marked_failed'
    | 'payout.cancelled'
    | 'payout.dispersed'
    | 'payout.dispersion_failed'
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
    | 'promoter.revoked'
    | 'payment.gateway_connected'
    | 'payment.gateway_disconnected';

export type AuditActorKind = 'user' | 'system';
