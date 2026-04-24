import { EventStaffEntity } from '../../domain/entities/event-staff.entity';
import { EventStaffOrmEntity } from '../orm/event-staff.orm.entity';

export class EventStaffMapper {
    static toDomain(orm: EventStaffOrmEntity): EventStaffEntity {
        return new EventStaffEntity({
            id: orm.id,
            eventId: orm.eventId,
            userId: orm.userId,
            role: orm.role,
            assignedByUserId: orm.assignedByUserId,
            note: orm.note,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: EventStaffEntity,
    ): Partial<EventStaffOrmEntity> {
        return {
            id: entity.id,
            eventId: entity.eventId,
            userId: entity.userId,
            role: entity.role,
            assignedByUserId: entity.assignedByUserId,
            note: entity.note ?? null,
        };
    }
}
