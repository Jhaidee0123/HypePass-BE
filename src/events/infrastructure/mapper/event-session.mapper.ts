import { EventSessionEntity } from '../../domain/entities/event-session.entity';
import { EventSessionOrmEntity } from '../orm/event-session.orm.entity';

export class EventSessionMapper {
    static toDomain(orm: EventSessionOrmEntity): EventSessionEntity {
        return new EventSessionEntity({
            id: orm.id,
            eventId: orm.eventId,
            name: orm.name,
            startsAt: orm.startsAt,
            endsAt: orm.endsAt,
            timezone: orm.timezone,
            salesStartAt: orm.salesStartAt,
            salesEndAt: orm.salesEndAt,
            doorsOpenAt: orm.doorsOpenAt,
            checkinStartAt: orm.checkinStartAt,
            transferCutoffAt: orm.transferCutoffAt,
            resaleCutoffAt: orm.resaleCutoffAt,
            qrVisibleFrom: orm.qrVisibleFrom,
            status: orm.status,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: EventSessionEntity,
    ): Partial<EventSessionOrmEntity> {
        return {
            id: entity.id,
            eventId: entity.eventId,
            name: entity.name ?? null,
            startsAt: entity.startsAt,
            endsAt: entity.endsAt,
            timezone: entity.timezone,
            salesStartAt: entity.salesStartAt ?? null,
            salesEndAt: entity.salesEndAt ?? null,
            doorsOpenAt: entity.doorsOpenAt ?? null,
            checkinStartAt: entity.checkinStartAt ?? null,
            transferCutoffAt: entity.transferCutoffAt ?? null,
            resaleCutoffAt: entity.resaleCutoffAt ?? null,
            qrVisibleFrom: entity.qrVisibleFrom ?? null,
            status: entity.status,
        };
    }
}
