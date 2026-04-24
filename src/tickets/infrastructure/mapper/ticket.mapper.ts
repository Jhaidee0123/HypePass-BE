import { TicketEntity } from '../../domain/entities/ticket.entity';
import { TicketOrmEntity } from '../orm/ticket.orm.entity';

export class TicketMapper {
    static toDomain(orm: TicketOrmEntity): TicketEntity {
        return new TicketEntity({
            id: orm.id,
            orderItemId: orm.orderItemId,
            originalOrderId: orm.originalOrderId,
            currentOwnerUserId: orm.currentOwnerUserId,
            eventId: orm.eventId,
            eventSessionId: orm.eventSessionId,
            ticketSectionId: orm.ticketSectionId,
            ticketSalePhaseId: orm.ticketSalePhaseId,
            status: orm.status,
            ownershipVersion: orm.ownershipVersion,
            faceValue: orm.faceValue,
            latestSalePrice: orm.latestSalePrice,
            currency: orm.currency,
            qrGenerationVersion: orm.qrGenerationVersion,
            courtesy: orm.courtesy,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: TicketEntity): Partial<TicketOrmEntity> {
        return {
            id: entity.id,
            orderItemId: entity.orderItemId,
            originalOrderId: entity.originalOrderId,
            currentOwnerUserId: entity.currentOwnerUserId,
            eventId: entity.eventId,
            eventSessionId: entity.eventSessionId,
            ticketSectionId: entity.ticketSectionId,
            ticketSalePhaseId: entity.ticketSalePhaseId ?? null,
            status: entity.status,
            ownershipVersion: entity.ownershipVersion,
            faceValue: entity.faceValue,
            latestSalePrice: entity.latestSalePrice ?? null,
            currency: entity.currency,
            qrGenerationVersion: entity.qrGenerationVersion,
            courtesy: entity.courtesy,
        };
    }
}
