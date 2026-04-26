import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { EventPromoterOrmEntity } from '../../infrastructure/orm/event-promoter.orm.entity';
import { EventPromoterMapper } from '../../infrastructure/mapper/event-promoter.mapper';
import { EventPromoterEntity } from '../../domain/entities/event-promoter.entity';
import { IEventPromoterRepository } from '../../domain/repositories/event-promoter.repository';

const UNAMBIGUOUS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, no 1/I/L

@Injectable()
export class EventPromoterService implements IEventPromoterRepository {
    constructor(
        @InjectRepository(EventPromoterOrmEntity)
        private readonly repo: Repository<EventPromoterOrmEntity>,
    ) {}

    async findById(id: string): Promise<EventPromoterEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? EventPromoterMapper.toDomain(row) : null;
    }

    async findByEvent(eventId: string): Promise<EventPromoterEntity[]> {
        const rows = await this.repo.find({
            where: { eventId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventPromoterMapper.toDomain);
    }

    async findActiveByEvent(eventId: string): Promise<EventPromoterEntity[]> {
        const rows = await this.repo.find({
            where: { eventId, revokedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventPromoterMapper.toDomain);
    }

    async findActiveByEventAndCode(
        eventId: string,
        referralCode: string,
    ): Promise<EventPromoterEntity | null> {
        const row = await this.repo.findOne({
            where: {
                eventId,
                referralCode: referralCode.toUpperCase(),
                revokedAt: IsNull(),
            },
        });
        return row ? EventPromoterMapper.toDomain(row) : null;
    }

    async findActiveByEventAndUser(
        eventId: string,
        userId: string,
    ): Promise<EventPromoterEntity | null> {
        const row = await this.repo.findOne({
            where: { eventId, userId, revokedAt: IsNull() },
        });
        return row ? EventPromoterMapper.toDomain(row) : null;
    }

    async findActiveByUser(userId: string): Promise<EventPromoterEntity[]> {
        const rows = await this.repo.find({
            where: { userId, revokedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventPromoterMapper.toDomain);
    }

    async findHistoricalByUser(
        userId: string,
    ): Promise<EventPromoterEntity[]> {
        const rows = await this.repo.find({
            where: { userId, revokedAt: Not(IsNull()) },
            order: { createdAt: 'DESC' },
        });
        return rows.map(EventPromoterMapper.toDomain);
    }

    async isCodeAvailable(
        eventId: string,
        referralCode: string,
    ): Promise<boolean> {
        const existing = await this.repo.findOne({
            where: {
                eventId,
                referralCode: referralCode.toUpperCase(),
                revokedAt: IsNull(),
            },
        });
        return existing === null;
    }

    async create(entity: EventPromoterEntity): Promise<EventPromoterEntity> {
        const row = this.repo.create(EventPromoterMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return EventPromoterMapper.toDomain(saved);
    }

    async update(entity: EventPromoterEntity): Promise<EventPromoterEntity> {
        await this.repo.update(
            entity.id,
            EventPromoterMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return EventPromoterMapper.toDomain(updated);
    }

    /**
     * Generates a unique referral code per event. Format:
     *   <UPPER_SLUG_PREFIX_4>-<6_RANDOM_FROM_UNAMBIGUOUS_ALPHABET>
     * The slug prefix gives codes a recognizable shape; the 6-char suffix
     * (31^6 ≈ 887M) keeps collisions astronomically unlikely. We still loop
     * up to 8 retries against the partial-unique index just in case.
     */
    async generateUniqueCodeForEvent(
        eventId: string,
        eventSlug: string,
    ): Promise<string> {
        const prefix = (eventSlug || 'EVT')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 4) || 'EVT';
        for (let attempt = 0; attempt < 8; attempt += 1) {
            const suffix = this.randomToken(6);
            const code = `${prefix}-${suffix}`;
            // eslint-disable-next-line no-await-in-loop
            if (await this.isCodeAvailable(eventId, code)) return code;
        }
        // Last-resort fallback: longer suffix.
        const suffix = this.randomToken(10);
        return `${prefix}-${suffix}`;
    }

    private randomToken(length: number): string {
        const bytes = randomBytes(length);
        let out = '';
        for (let i = 0; i < length; i += 1) {
            out += UNAMBIGUOUS[bytes[i] % UNAMBIGUOUS.length];
        }
        return out;
    }
}
