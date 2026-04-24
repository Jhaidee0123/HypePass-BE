import { EventPublicationReviewEntity } from '../entities/event-publication-review.entity';

export interface IEventPublicationReviewRepository {
    findById(id: string): Promise<EventPublicationReviewEntity | null>;
    findByEvent(eventId: string): Promise<EventPublicationReviewEntity[]>;
    findLatestPendingByEvent(
        eventId: string,
    ): Promise<EventPublicationReviewEntity | null>;
    create(
        entity: EventPublicationReviewEntity,
    ): Promise<EventPublicationReviewEntity>;
    update(
        entity: EventPublicationReviewEntity,
    ): Promise<EventPublicationReviewEntity>;
}
