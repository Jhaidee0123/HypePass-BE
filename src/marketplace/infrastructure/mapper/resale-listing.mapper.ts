import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { ResaleListingOrmEntity } from '../orm/resale-listing.orm.entity';

export class ResaleListingMapper {
    static toDomain(orm: ResaleListingOrmEntity): ResaleListingEntity {
        return new ResaleListingEntity({
            id: orm.id,
            ticketId: orm.ticketId,
            sellerUserId: orm.sellerUserId,
            askPrice: orm.askPrice,
            platformFeeAmount: orm.platformFeeAmount,
            sellerNetAmount: orm.sellerNetAmount,
            currency: orm.currency,
            status: orm.status,
            note: orm.note,
            reservedByUserId: orm.reservedByUserId,
            reservedUntil: orm.reservedUntil,
            expiresAt: orm.expiresAt,
            cancelledAt: orm.cancelledAt,
            soldAt: orm.soldAt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: ResaleListingEntity,
    ): Partial<ResaleListingOrmEntity> {
        return {
            id: entity.id,
            ticketId: entity.ticketId,
            sellerUserId: entity.sellerUserId,
            askPrice: entity.askPrice,
            platformFeeAmount: entity.platformFeeAmount,
            sellerNetAmount: entity.sellerNetAmount,
            currency: entity.currency,
            status: entity.status,
            note: entity.note ?? null,
            reservedByUserId: entity.reservedByUserId ?? null,
            reservedUntil: entity.reservedUntil ?? null,
            expiresAt: entity.expiresAt ?? null,
            cancelledAt: entity.cancelledAt ?? null,
            soldAt: entity.soldAt ?? null,
        };
    }
}
