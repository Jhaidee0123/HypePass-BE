import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketSalePhaseOrmEntity } from '../../infrastructure/orm/ticket-sale-phase.orm.entity';
import { TicketSalePhaseMapper } from '../../infrastructure/mapper/ticket-sale-phase.mapper';
import { TicketSalePhaseEntity } from '../../domain/entities/ticket-sale-phase.entity';
import { ITicketSalePhaseRepository } from '../../domain/repositories/ticket-sale-phase.repository';

@Injectable()
export class TicketSalePhaseService implements ITicketSalePhaseRepository {
    constructor(
        @InjectRepository(TicketSalePhaseOrmEntity)
        private readonly repo: Repository<TicketSalePhaseOrmEntity>,
    ) {}

    async findById(id: string): Promise<TicketSalePhaseEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? TicketSalePhaseMapper.toDomain(row) : null;
    }

    async findBySection(
        ticketSectionId: string,
    ): Promise<TicketSalePhaseEntity[]> {
        const rows = await this.repo.find({
            where: { ticketSectionId },
            order: { sortOrder: 'ASC', startsAt: 'ASC' },
        });
        return rows.map(TicketSalePhaseMapper.toDomain);
    }

    async create(
        entity: TicketSalePhaseEntity,
    ): Promise<TicketSalePhaseEntity> {
        const row = this.repo.create(
            TicketSalePhaseMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return TicketSalePhaseMapper.toDomain(saved);
    }

    async update(
        entity: TicketSalePhaseEntity,
    ): Promise<TicketSalePhaseEntity> {
        await this.repo.update(
            entity.id,
            TicketSalePhaseMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return TicketSalePhaseMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
