export enum EventStatus {
    DRAFT = 'draft',
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PUBLISHED = 'published',
    UNPUBLISHED = 'unpublished',
    CANCELLED = 'cancelled',
    ENDED = 'ended',
}

export const PUBLIC_EVENT_STATUSES: EventStatus[] = [EventStatus.PUBLISHED];

export const EDITABLE_BY_ORGANIZER_STATUSES: EventStatus[] = [
    EventStatus.DRAFT,
    EventStatus.REJECTED,
    EventStatus.APPROVED,
    EventStatus.UNPUBLISHED,
];
