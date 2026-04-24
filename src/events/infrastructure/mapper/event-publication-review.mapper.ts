import { EventPublicationReviewEntity } from '../../domain/entities/event-publication-review.entity';
import { EventPublicationReviewOrmEntity } from '../orm/event-publication-review.orm.entity';

export class EventPublicationReviewMapper {
    static toDomain(
        orm: EventPublicationReviewOrmEntity,
    ): EventPublicationReviewEntity {
        return new EventPublicationReviewEntity({
            id: orm.id,
            eventId: orm.eventId,
            submittedByUserId: orm.submittedByUserId,
            reviewedByUserId: orm.reviewedByUserId,
            status: orm.status,
            reviewNotes: orm.reviewNotes,
            submittedAt: orm.submittedAt,
            reviewedAt: orm.reviewedAt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: EventPublicationReviewEntity,
    ): Partial<EventPublicationReviewOrmEntity> {
        return {
            id: entity.id,
            eventId: entity.eventId,
            submittedByUserId: entity.submittedByUserId,
            reviewedByUserId: entity.reviewedByUserId ?? null,
            status: entity.status,
            reviewNotes: entity.reviewNotes ?? null,
            submittedAt: entity.submittedAt,
            reviewedAt: entity.reviewedAt ?? null,
        };
    }
}
