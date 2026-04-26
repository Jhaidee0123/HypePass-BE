import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs.dto';
import { AuditLogAction } from '../../domain/types/audit-log-action';

export type ListAuditLogsResultItem = {
    id: string;
    createdAt: string;
    actorKind: 'user' | 'system';
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId: string;
    metadata: Record<string, unknown> | null;
};

export type ListAuditLogsResult = {
    items: ListAuditLogsResultItem[];
    total: number;
    limit: number;
    offset: number;
};

@Injectable()
export class ListAuditLogsUseCase {
    constructor(private readonly auditLogs: AuditLogService) {}

    async execute(query: ListAuditLogsQueryDto): Promise<ListAuditLogsResult> {
        const limit = query.limit ?? 50;
        const offset = query.offset ?? 0;

        const page = await this.auditLogs.findPaged({
            targetType: query.targetType,
            targetId: query.targetId,
            actorUserId: query.actorUserId,
            actorKind: query.actorKind,
            action: query.action as AuditLogAction | undefined,
            actionPrefix: query.actionPrefix,
            dateFrom: query.from ? new Date(query.from) : undefined,
            dateTo: query.to ? new Date(query.to) : undefined,
            limit,
            offset,
        });

        return {
            items: page.items.map((item) => ({
                id: item.id,
                createdAt: item.createdAt.toISOString(),
                actorKind: item.actorKind,
                actorUserId: item.actorUserId ?? null,
                action: item.action,
                targetType: item.targetType,
                targetId: item.targetId,
                metadata: (item.metadata ?? null) as Record<string, unknown> | null,
            })),
            total: page.total,
            limit,
            offset,
        };
    }
}
