import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TicketOrmEntity } from '../../infrastructure/orm/ticket.orm.entity';
import { TicketMapper } from '../../infrastructure/mapper/ticket.mapper';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import {
    ITicketRepository,
    TicketSectionStatusBreakdown,
} from '../../domain/repositories/ticket.repository';
import { TicketStatus } from '../../domain/types/ticket-status';

@Injectable()
export class TicketService implements ITicketRepository {
    constructor(
        @InjectRepository(TicketOrmEntity)
        private readonly repo: Repository<TicketOrmEntity>,
    ) {}

    async findById(id: string): Promise<TicketEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? TicketMapper.toDomain(row) : null;
    }

    async findByOwner(userId: string): Promise<TicketEntity[]> {
        const rows = await this.repo.find({
            where: { currentOwnerUserId: userId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(TicketMapper.toDomain);
    }

    async findByOrder(orderId: string): Promise<TicketEntity[]> {
        const rows = await this.repo.find({
            where: { originalOrderId: orderId },
            order: { createdAt: 'ASC' },
        });
        return rows.map(TicketMapper.toDomain);
    }

    countBySectionAndStatus(
        ticketSectionId: string,
        statuses: TicketStatus[],
    ): Promise<number> {
        return this.repo.count({
            where: {
                ticketSectionId,
                status: In(statuses),
            },
        });
    }

    async groupBySectionAndStatus(
        ticketSectionIds: string[],
    ): Promise<TicketSectionStatusBreakdown[]> {
        if (ticketSectionIds.length === 0) return [];
        const rows = (await this.repo
            .createQueryBuilder('t')
            .select('t.ticket_section_id', 'ticketSectionId')
            .addSelect('t.status', 'status')
            .addSelect('t.courtesy', 'courtesy')
            .addSelect('COUNT(*)::int', 'count')
            .addSelect('COALESCE(SUM(t.face_value), 0)::bigint', 'faceValueSum')
            .where('t.ticket_section_id IN (:...ids)', {
                ids: ticketSectionIds,
            })
            .groupBy('t.ticket_section_id')
            .addGroupBy('t.status')
            .addGroupBy('t.courtesy')
            .getRawMany()) as Array<{
            ticketSectionId: string;
            status: TicketStatus;
            courtesy: boolean;
            count: number;
            faceValueSum: string | number;
        }>;
        return rows.map((r) => ({
            ticketSectionId: r.ticketSectionId,
            status: r.status,
            courtesy: !!r.courtesy,
            count: Number(r.count) || 0,
            faceValueSum: Number(r.faceValueSum) || 0,
        }));
    }

    async create(entity: TicketEntity): Promise<TicketEntity> {
        const row = this.repo.create(TicketMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return TicketMapper.toDomain(saved);
    }

    async update(entity: TicketEntity): Promise<TicketEntity> {
        await this.repo.update(entity.id, TicketMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return TicketMapper.toDomain(updated);
    }
}
