import { TicketSectionEntity } from '../../domain/entities/ticket-section.entity';
import { TicketSectionOrmEntity } from '../orm/ticket-section.orm.entity';

export class TicketSectionMapper {
    static toDomain(orm: TicketSectionOrmEntity): TicketSectionEntity {
        return new TicketSectionEntity({
            id: orm.id,
            eventSessionId: orm.eventSessionId,
            name: orm.name,
            description: orm.description,
            totalInventory: orm.totalInventory,
            minPerOrder: orm.minPerOrder,
            maxPerOrder: orm.maxPerOrder,
            resaleAllowed: orm.resaleAllowed,
            transferAllowed: orm.transferAllowed,
            status: orm.status,
            sortOrder: orm.sortOrder,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: TicketSectionEntity,
    ): Partial<TicketSectionOrmEntity> {
        return {
            id: entity.id,
            eventSessionId: entity.eventSessionId,
            name: entity.name,
            description: entity.description ?? null,
            totalInventory: entity.totalInventory,
            minPerOrder: entity.minPerOrder,
            maxPerOrder: entity.maxPerOrder,
            resaleAllowed: entity.resaleAllowed,
            transferAllowed: entity.transferAllowed,
            status: entity.status,
            sortOrder: entity.sortOrder,
        };
    }
}
