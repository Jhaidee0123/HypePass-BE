import { EventEntity } from '../../domain/entities/event.entity';
import { EventOrmEntity } from '../orm/event.orm.entity';

export class EventMapper {
    static toDomain(orm: EventOrmEntity): EventEntity {
        return new EventEntity({
            id: orm.id,
            companyId: orm.companyId,
            categoryId: orm.categoryId,
            venueId: orm.venueId,
            title: orm.title,
            slug: orm.slug,
            shortDescription: orm.shortDescription,
            description: orm.description,
            coverImageUrl: orm.coverImageUrl,
            bannerImageUrl: orm.bannerImageUrl,
            status: orm.status,
            publicationSubmittedAt: orm.publicationSubmittedAt,
            publicationApprovedAt: orm.publicationApprovedAt,
            publicationRejectedAt: orm.publicationRejectedAt,
            publicationReviewedBy: orm.publicationReviewedBy,
            resaleEnabled: orm.resaleEnabled,
            transferEnabled: orm.transferEnabled,
            defaultQrVisibleHoursBefore: orm.defaultQrVisibleHoursBefore,
            currency: orm.currency,
            resalePriceCapMultiplier: orm.resalePriceCapMultiplier,
            resaleFeePct: orm.resaleFeePct,
            maxTicketsPerUserPerSession: orm.maxTicketsPerUserPerSession,
            locationName: orm.locationName,
            locationAddress: orm.locationAddress,
            locationLatitude: orm.locationLatitude,
            locationLongitude: orm.locationLongitude,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: EventEntity): Partial<EventOrmEntity> {
        return {
            id: entity.id,
            companyId: entity.companyId,
            categoryId: entity.categoryId ?? null,
            venueId: entity.venueId ?? null,
            title: entity.title,
            slug: entity.slug,
            shortDescription: entity.shortDescription ?? null,
            description: entity.description ?? null,
            coverImageUrl: entity.coverImageUrl ?? null,
            bannerImageUrl: entity.bannerImageUrl ?? null,
            status: entity.status,
            publicationSubmittedAt: entity.publicationSubmittedAt ?? null,
            publicationApprovedAt: entity.publicationApprovedAt ?? null,
            publicationRejectedAt: entity.publicationRejectedAt ?? null,
            publicationReviewedBy: entity.publicationReviewedBy ?? null,
            resaleEnabled: entity.resaleEnabled,
            transferEnabled: entity.transferEnabled,
            defaultQrVisibleHoursBefore:
                entity.defaultQrVisibleHoursBefore ?? null,
            currency: entity.currency,
            resalePriceCapMultiplier: entity.resalePriceCapMultiplier ?? null,
            resaleFeePct: entity.resaleFeePct ?? null,
            maxTicketsPerUserPerSession:
                entity.maxTicketsPerUserPerSession ?? null,
            locationName: entity.locationName ?? null,
            locationAddress: entity.locationAddress ?? null,
            locationLatitude: entity.locationLatitude ?? null,
            locationLongitude: entity.locationLongitude ?? null,
        };
    }
}
