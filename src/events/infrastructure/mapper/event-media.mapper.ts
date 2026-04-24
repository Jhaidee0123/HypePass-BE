import { EventMediaEntity } from '../../domain/entities/event-media.entity';
import { EventMediaOrmEntity } from '../orm/event-media.orm.entity';

export class EventMediaMapper {
    static toDomain(orm: EventMediaOrmEntity): EventMediaEntity {
        return new EventMediaEntity({
            id: orm.id,
            eventId: orm.eventId,
            url: orm.url,
            publicId: orm.publicId,
            type: orm.type,
            sortOrder: orm.sortOrder,
            alt: orm.alt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: EventMediaEntity,
    ): Partial<EventMediaOrmEntity> {
        return {
            id: entity.id,
            eventId: entity.eventId,
            url: entity.url,
            publicId: entity.publicId ?? null,
            type: entity.type,
            sortOrder: entity.sortOrder,
            alt: entity.alt ?? null,
        };
    }
}
