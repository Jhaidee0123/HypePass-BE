export const BETTER_AUTH = 'BETTER_AUTH';

export const SYSTEM_ROLES = {
    PLATFORM_ADMIN: 'platform_admin',
    USER: 'user',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// Roles de membresía dentro de una compañía organizadora. Los roles
// operativos por evento (p.ej. `checkin_staff`) viven en
// `event_staff_assignments` — el organizador asigna staff a cada evento, no
// a toda la compañía. El rol antiguo `CHECKIN_STAFF` fue removido de este
// enum; filas legacy con ese valor en `company_memberships` quedan inertes.
export const COMPANY_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    STAFF: 'staff',
} as const;

export type CompanyRole = (typeof COMPANY_ROLES)[keyof typeof COMPANY_ROLES];
