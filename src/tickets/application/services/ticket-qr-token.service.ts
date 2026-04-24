import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketQrTokenOrmEntity } from '../../infrastructure/orm/ticket-qr-token.orm.entity';
import { TicketQrTokenMapper } from '../../infrastructure/mapper/ticket-qr-token.mapper';
import { TicketQrTokenEntity } from '../../domain/entities/ticket-qr-token.entity';
import { ITicketQrTokenRepository } from '../../domain/repositories/ticket-qr-token.repository';

@Injectable()
export class TicketQrTokenService implements ITicketQrTokenRepository {
    constructor(
        @InjectRepository(TicketQrTokenOrmEntity)
        private readonly repo: Repository<TicketQrTokenOrmEntity>,
    ) {}

    async findActiveByTicket(
        ticketId: string,
    ): Promise<TicketQrTokenEntity | null> {
        const row = await this.repo.findOne({
            where: { ticketId, isActive: true },
            order: { createdAt: 'DESC' },
        });
        return row ? TicketQrTokenMapper.toDomain(row) : null;
    }

    async create(
        entity: TicketQrTokenEntity,
    ): Promise<TicketQrTokenEntity> {
        const row = this.repo.create(
            TicketQrTokenMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return TicketQrTokenMapper.toDomain(saved);
    }

    async deactivateAllForTicket(ticketId: string): Promise<void> {
        await this.repo.update({ ticketId, isActive: true }, { isActive: false });
    }
}
