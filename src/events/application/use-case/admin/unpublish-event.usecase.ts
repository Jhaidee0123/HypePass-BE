import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';
import { EventEntity } from '../../../domain/entities/event.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { EventStatus } from '../../../domain/types/event-status';

export class UnpublishEventUseCase {
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
        if (event.status !== EventStatus.PUBLISHED) {
            throw new UnprocessableDomainException(
                `Event must be published to be unpublished (current: ${event.status})`,
                'EVENT_NOT_PUBLISHED',
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
            status: EventStatus.UNPUBLISHED,
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
            action: 'event.unpublished',
            targetType: 'event',
            targetId: saved.id,
            actorUserId: adminUserId,
        });
        return saved;
    }
}
