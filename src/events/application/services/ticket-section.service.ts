import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketSectionOrmEntity } from '../../infrastructure/orm/ticket-section.orm.entity';
import { TicketSectionMapper } from '../../infrastructure/mapper/ticket-section.mapper';
import { TicketSectionEntity } from '../../domain/entities/ticket-section.entity';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';

@Injectable()
export class TicketSectionService implements ITicketSectionRepository {
    constructor(
        @InjectRepository(TicketSectionOrmEntity)
        private readonly repo: Repository<TicketSectionOrmEntity>,
    ) {}

    async findById(id: string): Promise<TicketSectionEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? TicketSectionMapper.toDomain(row) : null;
    }

    async findByEventSession(
        eventSessionId: string,
    ): Promise<TicketSectionEntity[]> {
        const rows = await this.repo.find({
            where: { eventSessionId },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
        return rows.map(TicketSectionMapper.toDomain);
    }

    async create(entity: TicketSectionEntity): Promise<TicketSectionEntity> {
        const row = this.repo.create(TicketSectionMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return TicketSectionMapper.toDomain(saved);
    }

    async update(entity: TicketSectionEntity): Promise<TicketSectionEntity> {
        await this.repo.update(
            entity.id,
            TicketSectionMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return TicketSectionMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
