import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { EventEntity } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EDITABLE_BY_ORGANIZER_STATUSES } from '../../domain/types/event-status';
import { UpdateEventDto } from '../dto/update-event.dto';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class UpdateEventUseCase {
    constructor(private readonly repo: IEventRepository) {}

    async execute(
        companyId: string,
        eventId: string,
        dto: UpdateEventDto,
    ): Promise<EventEntity> {
        const current = await assertEventInCompany(
            this.repo,
            companyId,
            eventId,
        );
        if (!EDITABLE_BY_ORGANIZER_STATUSES.includes(current.status)) {
            throw new UnprocessableDomainException(
                `Event cannot be edited while status is "${current.status}"`,
                'EVENT_NOT_EDITABLE',
            );
        }
        if (dto.slug && dto.slug !== current.slug) {
            const existing = await this.repo.findBySlug(dto.slug);
            if (existing) {
                throw new ConflictDomainException(
                    `Event slug "${dto.slug}" is already taken`,
                    'EVENT_SLUG_TAKEN',
                );
            }
        }
        const next = new EventEntity({
            id: current.id,
            createdAt: current.createdAt,
            companyId: current.companyId,
            categoryId: dto.categoryId ?? current.categoryId,
            venueId: dto.venueId ?? current.venueId,
            title: dto.title ?? current.title,
            slug: dto.slug ?? current.slug,
            shortDescription: dto.shortDescription ?? current.shortDescription,
            description: dto.description ?? current.description,
            coverImageUrl: dto.coverImageUrl ?? current.coverImageUrl,
            bannerImageUrl: dto.bannerImageUrl ?? current.bannerImageUrl,
            status: current.status,
            publicationSubmittedAt: current.publicationSubmittedAt,
            publicationApprovedAt: current.publicationApprovedAt,
            publicationRejectedAt: current.publicationRejectedAt,
            publicationReviewedBy: current.publicationReviewedBy,
            resaleEnabled: dto.resaleEnabled ?? current.resaleEnabled,
            transferEnabled: dto.transferEnabled ?? current.transferEnabled,
            defaultQrVisibleHoursBefore:
                dto.defaultQrVisibleHoursBefore ??
                current.defaultQrVisibleHoursBefore,
            currency: dto.currency ?? current.currency,
            resalePriceCapMultiplier:
                dto.resalePriceCapMultiplier ??
                current.resalePriceCapMultiplier,
            resaleFeePct: dto.resaleFeePct ?? current.resaleFeePct,
            maxTicketsPerUserPerSession:
                dto.maxTicketsPerUserPerSession ??
                current.maxTicketsPerUserPerSession,
            updatedAt: new Date(),
        });
        return this.repo.update(next);
    }
}
