import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSessionOrmEntity } from '../../infrastructure/orm/event-session.orm.entity';
import { EventSessionMapper } from '../../infrastructure/mapper/event-session.mapper';
import { EventSessionEntity } from '../../domain/entities/event-session.entity';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';

@Injectable()
export class EventSessionService implements IEventSessionRepository {
    constructor(
        @InjectRepository(EventSessionOrmEntity)
        private readonly repo: Repository<EventSessionOrmEntity>,
    ) {}

    async findById(id: string): Promise<EventSessionEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? EventSessionMapper.toDomain(row) : null;
    }

    async findByEvent(eventId: string): Promise<EventSessionEntity[]> {
        const rows = await this.repo.find({
            where: { eventId },
            order: { startsAt: 'ASC' },
        });
        return rows.map(EventSessionMapper.toDomain);
    }

    async create(entity: EventSessionEntity): Promise<EventSessionEntity> {
        const row = this.repo.create(EventSessionMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return EventSessionMapper.toDomain(saved);
    }

    async update(entity: EventSessionEntity): Promise<EventSessionEntity> {
        await this.repo.update(
            entity.id,
            EventSessionMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return EventSessionMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
