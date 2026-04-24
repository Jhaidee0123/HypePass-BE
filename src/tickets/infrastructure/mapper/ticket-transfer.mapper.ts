import { TicketTransferEntity } from '../../domain/entities/ticket-transfer.entity';
import { TicketTransferOrmEntity } from '../orm/ticket-transfer.orm.entity';

export class TicketTransferMapper {
    static toDomain(orm: TicketTransferOrmEntity): TicketTransferEntity {
        return new TicketTransferEntity({
            id: orm.id,
            ticketId: orm.ticketId,
            fromUserId: orm.fromUserId,
            toUserId: orm.toUserId,
            status: orm.status,
            note: orm.note,
            initiatedAt: orm.initiatedAt,
            completedAt: orm.completedAt,
            expiresAt: orm.expiresAt,
            resultingOwnershipVersion: orm.resultingOwnershipVersion,
            resultingQrGenerationVersion: orm.resultingQrGenerationVersion,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: TicketTransferEntity,
    ): Partial<TicketTransferOrmEntity> {
        return {
            id: entity.id,
            ticketId: entity.ticketId,
            fromUserId: entity.fromUserId,
            toUserId: entity.toUserId,
            status: entity.status,
            note: entity.note ?? null,
            initiatedAt: entity.initiatedAt,
            completedAt: entity.completedAt ?? null,
            expiresAt: entity.expiresAt ?? null,
            resultingOwnershipVersion:
                entity.resultingOwnershipVersion ?? null,
            resultingQrGenerationVersion:
                entity.resultingQrGenerationVersion ?? null,
        };
    }
}
