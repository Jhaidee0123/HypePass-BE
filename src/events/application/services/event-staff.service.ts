import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStaffOrmEntity } from '../../infrastructure/orm/event-staff.orm.entity';
import { EventStaffMapper } from '../../infrastructure/mapper/event-staff.mapper';
import { EventStaffEntity } from '../../domain/entities/event-staff.entity';
import { IEventStaffRepository } from '../../domain/repositories/event-staff.repository';
import { EventStaffRole } from '../../domain/types/event-staff-role';

@Injectable()
export class EventStaffService implements IEventStaffRepository {
    constructor(
        @InjectRepository(EventStaffOrmEntity)
        private readonly repo: Repository<EventStaffOrmEntity>,
    ) {}

    async findById(id: string): Promise<EventStaffEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? EventStaffMapper.toDomain(row) : null;
    }

    async findByEvent(eventId: string): Promise<EventStaffEntity[]> {
        const rows = await this.repo.find({
            where: { eventId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventStaffMapper.toDomain);
    }

    async findByEventAndUser(
        eventId: string,
        userId: string,
    ): Promise<EventStaffEntity[]> {
        const rows = await this.repo.find({
            where: { eventId, userId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventStaffMapper.toDomain);
    }

    async findOne(
        eventId: string,
        userId: string,
        role: EventStaffRole,
    ): Promise<EventStaffEntity | null> {
        const row = await this.repo.findOne({
            where: { eventId, userId, role },
        });
        return row ? EventStaffMapper.toDomain(row) : null;
    }

    async findByUser(userId: string): Promise<EventStaffEntity[]> {
        const rows = await this.repo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventStaffMapper.toDomain);
    }

    async create(entity: EventStaffEntity): Promise<EventStaffEntity> {
        const row = this.repo.create(EventStaffMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return EventStaffMapper.toDomain(saved);
    }

    async update(entity: EventStaffEntity): Promise<EventStaffEntity> {
        await this.repo.update(
            entity.id,
            EventStaffMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return EventStaffMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
