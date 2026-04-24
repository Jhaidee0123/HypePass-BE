import { ResaleOrderEntity } from '../../domain/entities/resale-order.entity';
import { ResaleOrderOrmEntity } from '../orm/resale-order.orm.entity';

export class ResaleOrderMapper {
    static toDomain(orm: ResaleOrderOrmEntity): ResaleOrderEntity {
        return new ResaleOrderEntity({
            id: orm.id,
            resaleListingId: orm.resaleListingId,
            buyerUserId: orm.buyerUserId,
            orderId: orm.orderId,
            status: orm.status,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: ResaleOrderEntity,
    ): Partial<ResaleOrderOrmEntity> {
        return {
            id: entity.id,
            resaleListingId: entity.resaleListingId,
            buyerUserId: entity.buyerUserId,
            orderId: entity.orderId,
            status: entity.status,
        };
    }
}
