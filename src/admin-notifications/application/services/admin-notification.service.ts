import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AdminNotificationOrmEntity } from '../../infrastructure/orm/admin-notification.orm.entity';
import {
    AdminNotificationKind,
    AdminNotificationLevel,
} from '../../domain/types/admin-notification.types';
import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';

export type AdminNotificationRow = {
    id: string;
    createdAt: string;
    level: AdminNotificationLevel;
    kind: AdminNotificationKind;
    title: string;
    body: string | null;
    metadata: Record<string, unknown> | null;
    acknowledgedAt: string | null;
    acknowledgedByUserId: string | null;
};

const toRow = (orm: AdminNotificationOrmEntity): AdminNotificationRow => ({
    id: orm.id,
    createdAt: orm.createdAt.toISOString(),
    level: orm.level,
    kind: orm.kind,
    title: orm.title,
    body: orm.body,
    metadata: orm.metadata,
    acknowledgedAt: orm.acknowledgedAt ? orm.acknowledgedAt.toISOString() : null,
    acknowledgedByUserId: orm.acknowledgedByUserId,
});

@Injectable()
export class AdminNotificationService {
    private readonly logger = new Logger(AdminNotificationService.name);

    constructor(
        @InjectRepository(AdminNotificationOrmEntity)
        private readonly repo: Repository<AdminNotificationOrmEntity>,
    ) {}

    /** Fire-and-forget — never throws into the caller. */
    async record(input: {
        kind: AdminNotificationKind;
        level: AdminNotificationLevel;
        title: string;
        body?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        try {
            await this.repo.insert({
                id: randomUUID(),
                kind: input.kind,
                level: input.level,
                title: input.title.slice(0, 200),
                body: input.body ?? null,
                metadata: (input.metadata ?? null) as unknown as object,
                acknowledgedAt: null,
                acknowledgedByUserId: null,
            });
        } catch (err: any) {
            this.logger.warn(
                `admin notification record failed: ${err?.message}`,
            );
        }
    }

    async list(
        filter: { unackOnly?: boolean; limit?: number } = {},
    ): Promise<{ items: AdminNotificationRow[]; unackCount: number }> {
        const limit = filter.limit ?? 100;
        const where = filter.unackOnly ? { acknowledgedAt: IsNull() } : {};
        const [rows, unackCount] = await Promise.all([
            this.repo.find({
                where,
                order: { createdAt: 'DESC' },
                take: limit,
            }),
            this.repo.count({ where: { acknowledgedAt: IsNull() } }),
        ]);
        return { items: rows.map(toRow), unackCount };
    }

    async acknowledge(
        id: string,
        userId: string,
    ): Promise<AdminNotificationRow> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundDomainException(`notification ${id} not found`);
        if (!row.acknowledgedAt) {
            await this.repo.update(
                { id },
                {
                    acknowledgedAt: new Date(),
                    acknowledgedByUserId: userId,
                },
            );
        }
        const next = await this.repo.findOneOrFail({ where: { id } });
        return toRow(next);
    }

    async acknowledgeAll(userId: string): Promise<number> {
        const result = await this.repo
            .createQueryBuilder()
            .update()
            .set({
                acknowledgedAt: new Date(),
                acknowledgedByUserId: userId,
            })
            .where('acknowledged_at IS NULL')
            .execute();
        return result.affected ?? 0;
    }
}
