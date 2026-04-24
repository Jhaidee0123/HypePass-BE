import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity';
import {
    AuditLogFilter,
    IAuditLogRepository,
} from '../../domain/repositories/audit-log.repository';
import {
    AuditActorKind,
    AuditLogAction,
} from '../../domain/types/audit-log-action';
import { AuditLogOrmEntity } from '../../infrastructure/orm/audit-log.orm.entity';
import { AuditLogMapper } from '../../infrastructure/mapper/audit-log.mapper';

export type RecordAuditInput = {
    action: AuditLogAction;
    targetType: string;
    targetId: string;
    actorUserId?: string | null;
    actorKind?: AuditActorKind;
    metadata?: Record<string, unknown> | null;
};

/**
 * Central entry point for writing audit rows. Never throws — audit failures
 * must not break the underlying business action. Logs to pino and swallows.
 */
@Injectable()
export class AuditLogService implements IAuditLogRepository {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(
        @InjectRepository(AuditLogOrmEntity)
        private readonly repo: Repository<AuditLogOrmEntity>,
    ) {}

    async create(entity: AuditLogEntity): Promise<AuditLogEntity> {
        const row = this.repo.create(AuditLogMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return AuditLogMapper.toDomain(saved);
    }

    async findMany(filter: AuditLogFilter): Promise<AuditLogEntity[]> {
        const where: Record<string, unknown> = {};
        if (filter.targetType) where.targetType = filter.targetType;
        if (filter.targetId) where.targetId = filter.targetId;
        if (filter.actorUserId) where.actorUserId = filter.actorUserId;
        if (filter.action) where.action = filter.action;
        const rows = await this.repo.find({
            where,
            order: { createdAt: 'DESC' },
            take: filter.limit ?? 100,
        });
        return rows.map(AuditLogMapper.toDomain);
    }

    /** Fire-and-forget helper. Never throws. */
    async record(input: RecordAuditInput): Promise<void> {
        try {
            await this.create(
                new AuditLogEntity({
                    actorKind: input.actorKind ?? 'user',
                    actorUserId: input.actorUserId ?? null,
                    action: input.action,
                    targetType: input.targetType,
                    targetId: input.targetId,
                    metadata: input.metadata ?? null,
                }),
            );
        } catch (err: any) {
            this.logger.warn(
                `audit.record failed (${input.action} ${input.targetType}/${input.targetId}): ${err?.message}`,
            );
        }
    }
}
