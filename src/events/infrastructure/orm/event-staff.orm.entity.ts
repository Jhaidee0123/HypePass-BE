import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { EventStaffRole } from '../../domain/types/event-staff-role';

/**
 * Per-event staff assignment. Replaces the legacy `company_memberships.role =
 * 'checkin_staff'` model — staff are now granted scanning rights for a
 * specific event (and specific role within that event) by the event's
 * organizer (company owner/admin).
 */
@Entity({ name: 'event_staff_assignments' })
@Unique('uq_event_staff_event_user_role', ['eventId', 'userId', 'role'])
export class EventStaffOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Column({
        type: 'varchar',
        length: 30,
        default: EventStaffRole.CHECKIN_STAFF,
    })
    role: EventStaffRole;

    @Column('text', { name: 'assigned_by_user_id' })
    assignedByUserId: string;

    @Column('varchar', { length: 200, nullable: true })
    note: string | null;
}
