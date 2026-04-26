/**
 * Stable list of mutable platform-level settings. Each is safe to flip
 * at runtime — no secrets, no schema deps. New settings must be added here
 * + seeded via PlatformSettingsService.bootstrapDefaults().
 */
export type PlatformSettingKey =
    | 'maintenance.enabled'
    | 'maintenance.message'
    | 'signups.enabled'
    | 'checkout.enabled'
    | 'resale.enabled'
    | 'defaults.resaleFeePct'
    | 'defaults.resalePriceCapMultiplier'
    | 'defaults.qrVisibleHoursBefore'
    | 'defaults.maxTicketsPerUserPerSession'
    | 'platform.commissionPct'
    | 'platform.featuredEventIds';

export type PlatformSettingValueType = 'boolean' | 'number' | 'string' | 'string_array';

export type PlatformSettingDef = {
    key: PlatformSettingKey;
    type: PlatformSettingValueType;
    defaultValue: unknown;
    description: string;
    /** Group used by the admin UI to organize cards. */
    group: 'kill_switches' | 'commerce' | 'qr' | 'curation' | 'announcements';
};

export const PLATFORM_SETTINGS_CATALOG: PlatformSettingDef[] = [
    {
        key: 'maintenance.enabled',
        type: 'boolean',
        defaultValue: false,
        description: 'Show platform-wide maintenance banner and disable mutating endpoints.',
        group: 'announcements',
    },
    {
        key: 'maintenance.message',
        type: 'string',
        defaultValue: '',
        description: 'Banner copy shown when maintenance mode is on.',
        group: 'announcements',
    },
    {
        key: 'signups.enabled',
        type: 'boolean',
        defaultValue: true,
        description: 'Allow new users to register. Toggling off does NOT log out existing sessions.',
        group: 'kill_switches',
    },
    {
        key: 'checkout.enabled',
        type: 'boolean',
        defaultValue: true,
        description: 'Allow primary checkout. Off → /checkout returns 503 until re-enabled.',
        group: 'kill_switches',
    },
    {
        key: 'resale.enabled',
        type: 'boolean',
        defaultValue: true,
        description: 'Allow secondary marketplace listings + resale checkout globally.',
        group: 'kill_switches',
    },
    {
        key: 'defaults.resaleFeePct',
        type: 'number',
        defaultValue: 10,
        description: 'Default platform commission on resale (percentage). Per-event override wins.',
        group: 'commerce',
    },
    {
        key: 'defaults.resalePriceCapMultiplier',
        type: 'number',
        defaultValue: 1.2,
        description: 'Default multiplier on face value for resale listings. Per-event override wins.',
        group: 'commerce',
    },
    {
        key: 'platform.commissionPct',
        type: 'number',
        defaultValue: 8,
        description: 'Platform commission on primary checkout (percentage of gross).',
        group: 'commerce',
    },
    {
        key: 'defaults.qrVisibleHoursBefore',
        type: 'number',
        defaultValue: 6,
        description: 'Default hours before session start when QR becomes visible. Per-session/event override wins.',
        group: 'qr',
    },
    {
        key: 'defaults.maxTicketsPerUserPerSession',
        type: 'number',
        defaultValue: 10,
        description: 'Default per-user-per-session ticket cap when an event does not specify one.',
        group: 'commerce',
    },
    {
        key: 'platform.featuredEventIds',
        type: 'string_array',
        defaultValue: [],
        description: 'Ordered list of event IDs to surface in the public hero/feature slot.',
        group: 'curation',
    },
];

export const SETTINGS_BY_KEY = new Map(
    PLATFORM_SETTINGS_CATALOG.map((s) => [s.key, s]),
);
