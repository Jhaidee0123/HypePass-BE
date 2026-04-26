import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';
import { EventEntity } from '../../../domain/entities/event.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { EventStatus } from '../../../domain/types/event-status';

export class PublishEventUseCase {
    constructor(
        private readonly repo: IEventRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        adminUserId: string,
        eventId: string,
    ): Promise<EventEntity> {
        const event = await this.repo.findById(eventId);
        if (!event) throw new NotFoundDomainException('Event not found');
        if (
            event.status !== EventStatus.APPROVED &&
            event.status !== EventStatus.UNPUBLISHED
        ) {
            throw new UnprocessableDomainException(
                `Event must be approved or unpublished to be published (current: ${event.status})`,
                'EVENT_NOT_PUBLISHABLE',
            );
        }
        const next = new EventEntity({
            id: event.id,
            createdAt: event.createdAt,
            companyId: event.companyId,
            categoryId: event.categoryId,
            venueId: event.venueId,
            title: event.title,
            slug: event.slug,
            shortDescription: event.shortDescription,
            description: event.description,
            coverImageUrl: event.coverImageUrl,
            bannerImageUrl: event.bannerImageUrl,
            status: EventStatus.PUBLISHED,
            publicationSubmittedAt: event.publicationSubmittedAt,
            publicationApprovedAt: event.publicationApprovedAt,
            publicationRejectedAt: event.publicationRejectedAt,
            publicationReviewedBy: adminUserId,
            resaleEnabled: event.resaleEnabled,
            transferEnabled: event.transferEnabled,
            defaultQrVisibleHoursBefore: event.defaultQrVisibleHoursBefore,
            currency: event.currency,
            resalePriceCapMultiplier: event.resalePriceCapMultiplier,
            resaleFeePct: event.resaleFeePct,
            maxTicketsPerUserPerSession: event.maxTicketsPerUserPerSession,
            locationName: event.locationName,
            locationAddress: event.locationAddress,
            locationLatitude: event.locationLatitude,
            locationLongitude: event.locationLongitude,
            updatedAt: new Date(),
        });
        const saved = await this.repo.update(next);
        await this.audit.record({
            action: 'event.published',
            targetType: 'event',
            targetId: saved.id,
            actorUserId: adminUserId,
        });
        return saved;
    }
}
