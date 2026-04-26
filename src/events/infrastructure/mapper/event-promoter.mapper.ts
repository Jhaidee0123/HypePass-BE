import { EventPromoterEntity } from '../../domain/entities/event-promoter.entity';
import { EventPromoterOrmEntity } from '../orm/event-promoter.orm.entity';

export class EventPromoterMapper {
    static toDomain(orm: EventPromoterOrmEntity): EventPromoterEntity {
        return new EventPromoterEntity({
            id: orm.id,
            eventId: orm.eventId,
            userId: orm.userId,
            referralCode: orm.referralCode,
            assignedByUserId: orm.assignedByUserId,
            note: orm.note,
            revokedAt: orm.revokedAt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: EventPromoterEntity,
    ): Partial<EventPromoterOrmEntity> {
        return {
            id: entity.id,
            eventId: entity.eventId,
            userId: entity.userId,
            referralCode: entity.referralCode,
            assignedByUserId: entity.assignedByUserId,
            note: entity.note ?? null,
            revokedAt: entity.revokedAt ?? null,
        };
    }
}
