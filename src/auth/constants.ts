export const BETTER_AUTH = 'BETTER_AUTH';

export const SYSTEM_ROLES = {
    PLATFORM_ADMIN: 'platform_admin',
    USER: 'user',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// Roles de membresía dentro de una compañía organizadora.
//
// - OWNER: dueño legal — todo lo de ADMIN + invitar/remover miembros y
//          recibir los emails críticos (aprobaciones, rechazos). Único
//          que puede *borrar* eventos.
// - ADMIN: opera el día a día — crea/edita eventos, vende, asigna staff
//          de evento, ve ventas. NO invita miembros, NO borra eventos.
// - VIEWER: rol de observación de solo lectura. Puede ver el listado
//          de eventos, dashboard de ventas, lista de asistentes. NO
//          puede editar nada. Pensado para socios, contadores y
//          equipos de marketing externos.
//
// Roles operativos por evento (check-in scanner) viven en
// `event_staff_assignments` — eso NO es lo mismo que ser miembro de la
// compañía. Por eso el rol antes llamado `STAFF` aquí se renombró a
// `VIEWER`: para no confundir al organizador con el "staff del evento"
// que escanea QR en la puerta.
//
// El rol legacy `CHECKIN_STAFF` fue removido hace tiempo; filas con ese
// valor quedan inertes (no aparecen en ningún listado activo).
export const COMPANY_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    VIEWER: 'viewer',
} as const;

export type CompanyRole = (typeof COMPANY_ROLES)[keyof typeof COMPANY_ROLES];
