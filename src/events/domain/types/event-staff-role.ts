/**
 * Per-event staff roles. Kept as a string enum to make future extension
 * trivial (door/merch/...) without a schema migration — the column is just
 * a `varchar(30)` in `event_staff_assignments`.
 */
export enum EventStaffRole {
    CHECKIN_STAFF = 'checkin_staff',
}

export const EVENT_STAFF_ROLE_VALUES: string[] = Object.values(EventStaffRole);
