import { TicketSalePhaseEntity } from '../../domain/entities/ticket-sale-phase.entity';
import { TicketSalePhaseOrmEntity } from '../orm/ticket-sale-phase.orm.entity';

export class TicketSalePhaseMapper {
    static toDomain(orm: TicketSalePhaseOrmEntity): TicketSalePhaseEntity {
        return new TicketSalePhaseEntity({
            id: orm.id,
            ticketSectionId: orm.ticketSectionId,
            name: orm.name,
            startsAt: orm.startsAt,
            endsAt: orm.endsAt,
            price: orm.price,
            currency: orm.currency,
            serviceFee: orm.serviceFee,
            platformFee: orm.platformFee,
            taxAmount: orm.taxAmount,
            maxPerOrder: orm.maxPerOrder,
            maxPerUser: orm.maxPerUser,
            sortOrder: orm.sortOrder,
            isActive: orm.isActive,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: TicketSalePhaseEntity,
    ): Partial<TicketSalePhaseOrmEntity> {
        return {
            id: entity.id,
            ticketSectionId: entity.ticketSectionId,
            name: entity.name,
            startsAt: entity.startsAt,
            endsAt: entity.endsAt,
            price: entity.price,
            currency: entity.currency,
            serviceFee: entity.serviceFee ?? null,
            platformFee: entity.platformFee ?? null,
            taxAmount: entity.taxAmount ?? null,
            maxPerOrder: entity.maxPerOrder ?? null,
            maxPerUser: entity.maxPerUser ?? null,
            sortOrder: entity.sortOrder,
            isActive: entity.isActive,
        };
    }
}
