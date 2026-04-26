import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuditActorKind, AuditLogAction } from '../types/audit-log-action';

export type AuditLogFilter = {
    targetType?: string;
    targetId?: string;
    actorUserId?: string;
    actorKind?: AuditActorKind;
    action?: AuditLogAction;
    actionPrefix?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
};

export type AuditLogPage = {
    items: AuditLogEntity[];
    total: number;
};

export interface IAuditLogRepository {
    create(entity: AuditLogEntity): Promise<AuditLogEntity>;
    findMany(filter: AuditLogFilter): Promise<AuditLogEntity[]>;
    findPaged(filter: AuditLogFilter): Promise<AuditLogPage>;
}
