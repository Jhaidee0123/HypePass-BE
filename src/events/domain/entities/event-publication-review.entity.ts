import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { EventPublicationReviewProps } from '../types/event-publication-review.props';
import { EventPublicationReviewStatus } from '../types/event-publication-review-status';

export class EventPublicationReviewEntity extends BaseEntity {
    readonly eventId: string;
    readonly submittedByUserId: string;
    readonly reviewedByUserId?: string | null;
    readonly status: EventPublicationReviewStatus;
    readonly reviewNotes?: string | null;
    readonly submittedAt: Date;
    readonly reviewedAt?: Date | null;

    constructor(props: EventPublicationReviewProps) {
        super(props);
        this.eventId = props.eventId;
        this.submittedByUserId = props.submittedByUserId;
        this.reviewedByUserId = props.reviewedByUserId;
        this.status = props.status;
        this.reviewNotes = props.reviewNotes;
        this.submittedAt = props.submittedAt;
        this.reviewedAt = props.reviewedAt;
    }
}
