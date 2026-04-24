import { InventoryHoldEntity } from '../../domain/entities/inventory-hold.entity';
import { InventoryHoldOrmEntity } from '../orm/inventory-hold.orm.entity';

export class InventoryHoldMapper {
    static toDomain(orm: InventoryHoldOrmEntity): InventoryHoldEntity {
        return new InventoryHoldEntity({
            id: orm.id,
            userId: orm.userId,
            eventSessionId: orm.eventSessionId,
            ticketSectionId: orm.ticketSectionId,
            ticketSalePhaseId: orm.ticketSalePhaseId,
            quantity: orm.quantity,
            status: orm.status,
            expiresAt: orm.expiresAt,
            orderId: orm.orderId,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: InventoryHoldEntity,
    ): Partial<InventoryHoldOrmEntity> {
        return {
            id: entity.id,
            userId: entity.userId,
            eventSessionId: entity.eventSessionId,
            ticketSectionId: entity.ticketSectionId,
            ticketSalePhaseId: entity.ticketSalePhaseId,
            quantity: entity.quantity,
            status: entity.status,
            expiresAt: entity.expiresAt,
            orderId: entity.orderId ?? null,
        };
    }
}
