import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { EventPublicationReviewStatus } from '../../domain/types/event-publication-review-status';

@Entity({ name: 'event_publication_reviews' })
export class EventPublicationReviewOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Column('text', { name: 'submitted_by_user_id' })
    submittedByUserId: string;

    @Column('text', { name: 'reviewed_by_user_id', nullable: true })
    reviewedByUserId: string | null;

    @Index()
    @Column({
        type: 'varchar',
        length: 20,
        default: EventPublicationReviewStatus.PENDING,
    })
    status: EventPublicationReviewStatus;

    @Column('text', { name: 'review_notes', nullable: true })
    reviewNotes: string | null;

    @Column('timestamptz', { name: 'submitted_at' })
    submittedAt: Date;

    @Column('timestamptz', { name: 'reviewed_at', nullable: true })
    reviewedAt: Date | null;
}
