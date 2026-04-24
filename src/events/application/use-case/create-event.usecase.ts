import { ConflictDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { EventEntity } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventStatus } from '../../domain/types/event-status';
import { CreateEventDto } from '../dto/create-event.dto';

export class CreateEventUseCase {
    constructor(private readonly repo: IEventRepository) {}

    async execute(
        companyId: string,
        dto: CreateEventDto,
    ): Promise<EventEntity> {
        const existing = await this.repo.findBySlug(dto.slug);
        if (existing) {
            throw new ConflictDomainException(
                `Event slug "${dto.slug}" is already taken`,
                'EVENT_SLUG_TAKEN',
            );
        }
        const event = new EventEntity({
            companyId,
            categoryId: dto.categoryId ?? null,
            venueId: dto.venueId ?? null,
            title: dto.title,
            slug: dto.slug,
            shortDescription: dto.shortDescription ?? null,
            description: dto.description ?? null,
            coverImageUrl: dto.coverImageUrl ?? null,
            bannerImageUrl: dto.bannerImageUrl ?? null,
            status: EventStatus.DRAFT,
            resaleEnabled: dto.resaleEnabled ?? true,
            transferEnabled: dto.transferEnabled ?? true,
            defaultQrVisibleHoursBefore:
                dto.defaultQrVisibleHoursBefore ?? null,
            currency: dto.currency ?? 'COP',
            resalePriceCapMultiplier: dto.resalePriceCapMultiplier ?? null,
            resaleFeePct: dto.resaleFeePct ?? null,
            maxTicketsPerUserPerSession:
                dto.maxTicketsPerUserPerSession ?? null,
        });
        return this.repo.create(event);
    }
}
