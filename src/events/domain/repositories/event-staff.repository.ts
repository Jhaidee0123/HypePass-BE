import { EventStaffEntity } from '../entities/event-staff.entity';
import { EventStaffRole } from '../types/event-staff-role';

export interface IEventStaffRepository {
    findById(id: string): Promise<EventStaffEntity | null>;
    findByEvent(eventId: string): Promise<EventStaffEntity[]>;
    findByEventAndUser(
        eventId: string,
        userId: string,
    ): Promise<EventStaffEntity[]>;
    findOne(
        eventId: string,
        userId: string,
        role: EventStaffRole,
    ): Promise<EventStaffEntity | null>;
    findByUser(userId: string): Promise<EventStaffEntity[]>;
    create(entity: EventStaffEntity): Promise<EventStaffEntity>;
    update(entity: EventStaffEntity): Promise<EventStaffEntity>;
    delete(id: string): Promise<void>;
}
