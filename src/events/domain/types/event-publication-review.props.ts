import { BaseProps } from '../../../shared/domain/types/base.props';
import { EventPublicationReviewStatus } from './event-publication-review-status';

export type EventPublicationReviewProps = BaseProps & {
    eventId: string;
    submittedByUserId: string;
    reviewedByUserId?: string | null;
    status: EventPublicationReviewStatus;
    reviewNotes?: string | null;
    submittedAt: Date;
    reviewedAt?: Date | null;
};
