import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import { OrderItemOrmEntity } from '../orm/order-item.orm.entity';

export class OrderItemMapper {
    static toDomain(orm: OrderItemOrmEntity): OrderItemEntity {
        return new OrderItemEntity({
            id: orm.id,
            orderId: orm.orderId,
            eventId: orm.eventId,
            eventSessionId: orm.eventSessionId,
            ticketSectionId: orm.ticketSectionId,
            ticketSalePhaseId: orm.ticketSalePhaseId,
            quantity: orm.quantity,
            unitPrice: orm.unitPrice,
            serviceFee: orm.serviceFee,
            platformFee: orm.platformFee,
            taxAmount: orm.taxAmount,
            lineTotal: orm.lineTotal,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: OrderItemEntity): Partial<OrderItemOrmEntity> {
        return {
            id: entity.id,
            orderId: entity.orderId,
            eventId: entity.eventId,
            eventSessionId: entity.eventSessionId,
            ticketSectionId: entity.ticketSectionId,
            ticketSalePhaseId: entity.ticketSalePhaseId ?? null,
            quantity: entity.quantity,
            unitPrice: entity.unitPrice,
            serviceFee: entity.serviceFee,
            platformFee: entity.platformFee,
            taxAmount: entity.taxAmount,
            lineTotal: entity.lineTotal,
        };
    }
}
