import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketTransferOrmEntity } from '../../infrastructure/orm/ticket-transfer.orm.entity';
import { TicketTransferMapper } from '../../infrastructure/mapper/ticket-transfer.mapper';
import { TicketTransferEntity } from '../../domain/entities/ticket-transfer.entity';
import { ITicketTransferRepository } from '../../domain/repositories/ticket-transfer.repository';

@Injectable()
export class TicketTransferService implements ITicketTransferRepository {
    constructor(
        @InjectRepository(TicketTransferOrmEntity)
        private readonly repo: Repository<TicketTransferOrmEntity>,
    ) {}

    async findById(id: string): Promise<TicketTransferEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? TicketTransferMapper.toDomain(row) : null;
    }

    async findByTicket(ticketId: string): Promise<TicketTransferEntity[]> {
        const rows = await this.repo.find({
            where: { ticketId },
            order: { initiatedAt: 'DESC' },
        });
        return rows.map(TicketTransferMapper.toDomain);
    }

    async findSentByUser(userId: string): Promise<TicketTransferEntity[]> {
        const rows = await this.repo.find({
            where: { fromUserId: userId },
            order: { initiatedAt: 'DESC' },
        });
        return rows.map(TicketTransferMapper.toDomain);
    }

    async findReceivedByUser(
        userId: string,
    ): Promise<TicketTransferEntity[]> {
        const rows = await this.repo.find({
            where: { toUserId: userId },
            order: { initiatedAt: 'DESC' },
        });
        return rows.map(TicketTransferMapper.toDomain);
    }

    async create(
        entity: TicketTransferEntity,
    ): Promise<TicketTransferEntity> {
        const row = this.repo.create(TicketTransferMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return TicketTransferMapper.toDomain(saved);
    }
}
