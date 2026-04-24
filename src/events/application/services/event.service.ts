import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { EventOrmEntity } from '../../infrastructure/orm/event.orm.entity';
import { EventMapper } from '../../infrastructure/mapper/event.mapper';
import { EventEntity } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventQueryFilter } from '../../domain/types/event-query-filter';

@Injectable()
export class EventService implements IEventRepository {
    constructor(
        @InjectRepository(EventOrmEntity)
        private readonly repo: Repository<EventOrmEntity>,
    ) {}

    async findAll(query?: EventQueryFilter): Promise<EventEntity[]> {
        const where: Record<string, unknown> = {};
        if (query?.companyId) where.companyId = query.companyId;
        if (query?.categoryId) where.categoryId = query.categoryId;
        if (query?.status) where.status = query.status;
        if (query?.search) where.title = ILike(`%${query.search}%`);
        const rows = await this.repo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventMapper.toDomain);
    }

    async findById(id: string): Promise<EventEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? EventMapper.toDomain(row) : null;
    }

    async findBySlug(slug: string): Promise<EventEntity | null> {
        const row = await this.repo.findOne({ where: { slug } });
        return row ? EventMapper.toDomain(row) : null;
    }

    async create(entity: EventEntity): Promise<EventEntity> {
        const row = this.repo.create(EventMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return EventMapper.toDomain(saved);
    }

    async update(entity: EventEntity): Promise<EventEntity> {
        await this.repo.update(entity.id, EventMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return EventMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
