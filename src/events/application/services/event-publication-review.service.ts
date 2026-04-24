import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPublicationReviewOrmEntity } from '../../infrastructure/orm/event-publication-review.orm.entity';
import { EventPublicationReviewMapper } from '../../infrastructure/mapper/event-publication-review.mapper';
import { EventPublicationReviewEntity } from '../../domain/entities/event-publication-review.entity';
import { IEventPublicationReviewRepository } from '../../domain/repositories/event-publication-review.repository';
import { EventPublicationReviewStatus } from '../../domain/types/event-publication-review-status';

@Injectable()
export class EventPublicationReviewService
    implements IEventPublicationReviewRepository
{
    constructor(
        @InjectRepository(EventPublicationReviewOrmEntity)
        private readonly repo: Repository<EventPublicationReviewOrmEntity>,
    ) {}

    async findById(id: string): Promise<EventPublicationReviewEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? EventPublicationReviewMapper.toDomain(row) : null;
    }

    async findByEvent(
        eventId: string,
    ): Promise<EventPublicationReviewEntity[]> {
        const rows = await this.repo.find({
            where: { eventId },
            order: { submittedAt: 'DESC' },
        });
        return rows.map(EventPublicationReviewMapper.toDomain);
    }

    async findLatestPendingByEvent(
        eventId: string,
    ): Promise<EventPublicationReviewEntity | null> {
        const row = await this.repo.findOne({
            where: { eventId, status: EventPublicationReviewStatus.PENDING },
            order: { submittedAt: 'DESC' },
        });
        return row ? EventPublicationReviewMapper.toDomain(row) : null;
    }

    async create(
        entity: EventPublicationReviewEntity,
    ): Promise<EventPublicationReviewEntity> {
        const row = this.repo.create(
            EventPublicationReviewMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return EventPublicationReviewMapper.toDomain(saved);
    }

    async update(
        entity: EventPublicationReviewEntity,
    ): Promise<EventPublicationReviewEntity> {
        await this.repo.update(
            entity.id,
            EventPublicationReviewMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return EventPublicationReviewMapper.toDomain(updated);
    }
}
