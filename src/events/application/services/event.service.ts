import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { EventOrmEntity } from '../../infrastructure/orm/event.orm.entity';
import { EventSessionOrmEntity } from '../../infrastructure/orm/event-session.orm.entity';
import { TicketSectionOrmEntity } from '../../infrastructure/orm/ticket-section.orm.entity';
import { TicketSalePhaseOrmEntity } from '../../infrastructure/orm/ticket-sale-phase.orm.entity';
import { EventMediaOrmEntity } from '../../infrastructure/orm/event-media.orm.entity';
import { EventPublicationReviewOrmEntity } from '../../infrastructure/orm/event-publication-review.orm.entity';
import { EventStaffOrmEntity } from '../../infrastructure/orm/event-staff.orm.entity';
import { EventPromoterOrmEntity } from '../../infrastructure/orm/event-promoter.orm.entity';
import { EventMapper } from '../../infrastructure/mapper/event.mapper';
import { EventEntity } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventQueryFilter } from '../../domain/types/event-query-filter';

@Injectable()
export class EventService implements IEventRepository {
    constructor(
        @InjectRepository(EventOrmEntity)
        private readonly repo: Repository<EventOrmEntity>,
        private readonly ds: DataSource,
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

    /**
     * Cascade delete an event and all its child rows in a single
     * transaction. Required because the schema uses logical FK columns
     * (uuid only, no @ManyToOne relations) so TypeORM doesn't cascade by
     * itself. Caller must guard against deleting events with issued
     * tickets — this method assumes the financial-trail check already
     * passed.
     */
    async delete(id: string): Promise<void> {
        await this.ds.transaction(async (m) => {
            const sessions = await m.find(EventSessionOrmEntity, {
                where: { eventId: id },
                select: { id: true },
            });
            const sessionIds = sessions.map((s) => s.id);

            if (sessionIds.length > 0) {
                const sections = await m.find(TicketSectionOrmEntity, {
                    where: { eventSessionId: In(sessionIds) },
                    select: { id: true },
                });
                const sectionIds = sections.map((s) => s.id);
                if (sectionIds.length > 0) {
                    await m.delete(TicketSalePhaseOrmEntity, {
                        ticketSectionId: In(sectionIds),
                    });
                    await m.delete(TicketSectionOrmEntity, {
                        id: In(sectionIds),
                    });
                }
                await m.delete(EventSessionOrmEntity, {
                    id: In(sessionIds),
                });
            }

            await m.delete(EventMediaOrmEntity, { eventId: id });
            await m.delete(EventPublicationReviewOrmEntity, { eventId: id });
            await m.delete(EventStaffOrmEntity, { eventId: id });
            await m.delete(EventPromoterOrmEntity, { eventId: id });
            await m.delete(EventOrmEntity, id);
        });
    }
}
