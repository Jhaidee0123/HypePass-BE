import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { InventoryHoldOrmEntity } from '../../infrastructure/orm/inventory-hold.orm.entity';
import { InventoryHoldMapper } from '../../infrastructure/mapper/inventory-hold.mapper';
import { InventoryHoldEntity } from '../../domain/entities/inventory-hold.entity';
import {
    IInventoryHoldRepository,
    SectionActiveHoldSum,
} from '../../domain/repositories/inventory-hold.repository';
import { InventoryHoldStatus } from '../../domain/types/inventory-hold-status';

@Injectable()
export class InventoryHoldService implements IInventoryHoldRepository {
    constructor(
        @InjectRepository(InventoryHoldOrmEntity)
        private readonly repo: Repository<InventoryHoldOrmEntity>,
    ) {}

    async findById(id: string): Promise<InventoryHoldEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? InventoryHoldMapper.toDomain(row) : null;
    }

    async findByOrder(orderId: string): Promise<InventoryHoldEntity[]> {
        const rows = await this.repo.find({ where: { orderId } });
        return rows.map(InventoryHoldMapper.toDomain);
    }

    async sumActiveForSection(
        ticketSectionId: string,
        now: Date,
    ): Promise<number> {
        const { sum } = (await this.repo
            .createQueryBuilder('h')
            .select('COALESCE(SUM(h.quantity), 0)', 'sum')
            .where('h.ticket_section_id = :sid', { sid: ticketSectionId })
            .andWhere('h.status = :status', {
                status: InventoryHoldStatus.ACTIVE,
            })
            .andWhere('h.expires_at > :now', { now })
            .getRawOne()) as { sum: string };
        return parseInt(sum, 10) || 0;
    }

    async sumActiveForSections(
        ticketSectionIds: string[],
        now: Date,
    ): Promise<SectionActiveHoldSum[]> {
        if (ticketSectionIds.length === 0) return [];
        const rows = (await this.repo
            .createQueryBuilder('h')
            .select('h.ticket_section_id', 'ticketSectionId')
            .addSelect('COALESCE(SUM(h.quantity), 0)::bigint', 'quantity')
            .where('h.ticket_section_id IN (:...ids)', {
                ids: ticketSectionIds,
            })
            .andWhere('h.status = :status', {
                status: InventoryHoldStatus.ACTIVE,
            })
            .andWhere('h.expires_at > :now', { now })
            .groupBy('h.ticket_section_id')
            .getRawMany()) as Array<{
            ticketSectionId: string;
            quantity: string | number;
        }>;
        return rows.map((r) => ({
            ticketSectionId: r.ticketSectionId,
            quantity: Number(r.quantity) || 0,
        }));
    }

    async create(entity: InventoryHoldEntity): Promise<InventoryHoldEntity> {
        const row = this.repo.create(InventoryHoldMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return InventoryHoldMapper.toDomain(saved);
    }

    async update(entity: InventoryHoldEntity): Promise<InventoryHoldEntity> {
        await this.repo.update(
            entity.id,
            InventoryHoldMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return InventoryHoldMapper.toDomain(updated);
    }
}
