export type AdminNotificationLevel = 'info' | 'warn' | 'error';

export type AdminNotificationKind =
    | 'company.submitted'
    | 'event.submitted'
    | 'order.oversold'
    | 'payout.ready'
    | 'system.error'
    | 'support.opened'
    | 'support.dispute'
    | 'support.kyc';
