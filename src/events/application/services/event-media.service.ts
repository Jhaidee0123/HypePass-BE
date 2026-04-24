import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMediaOrmEntity } from '../../infrastructure/orm/event-media.orm.entity';
import { EventMediaMapper } from '../../infrastructure/mapper/event-media.mapper';
import { EventMediaEntity } from '../../domain/entities/event-media.entity';
import { IEventMediaRepository } from '../../domain/repositories/event-media.repository';

@Injectable()
export class EventMediaService implements IEventMediaRepository {
    constructor(
        @InjectRepository(EventMediaOrmEntity)
        private readonly repo: Repository<EventMediaOrmEntity>,
    ) {}

    async findById(id: string): Promise<EventMediaEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? EventMediaMapper.toDomain(row) : null;
    }

    async findByEvent(eventId: string): Promise<EventMediaEntity[]> {
        const rows = await this.repo.find({
            where: { eventId },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        });
        return rows.map(EventMediaMapper.toDomain);
    }

    async create(entity: EventMediaEntity): Promise<EventMediaEntity> {
        const row = this.repo.create(EventMediaMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return EventMediaMapper.toDomain(saved);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
