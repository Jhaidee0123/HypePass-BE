import { TicketQrTokenEntity } from '../../domain/entities/ticket-qr-token.entity';
import { TicketQrTokenOrmEntity } from '../orm/ticket-qr-token.orm.entity';

export class TicketQrTokenMapper {
    static toDomain(orm: TicketQrTokenOrmEntity): TicketQrTokenEntity {
        return new TicketQrTokenEntity({
            id: orm.id,
            ticketId: orm.ticketId,
            tokenHash: orm.tokenHash,
            tokenVersion: orm.tokenVersion,
            validFrom: orm.validFrom,
            validUntil: orm.validUntil,
            isActive: orm.isActive,
            generatedReason: orm.generatedReason,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: TicketQrTokenEntity,
    ): Partial<TicketQrTokenOrmEntity> {
        return {
            id: entity.id,
            ticketId: entity.ticketId,
            tokenHash: entity.tokenHash,
            tokenVersion: entity.tokenVersion,
            validFrom: entity.validFrom,
            validUntil: entity.validUntil ?? null,
            isActive: entity.isActive,
            generatedReason: entity.generatedReason,
        };
    }
}
