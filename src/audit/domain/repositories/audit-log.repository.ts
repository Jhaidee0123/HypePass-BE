import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuditLogAction } from '../types/audit-log-action';

export type AuditLogFilter = {
    targetType?: string;
    targetId?: string;
    actorUserId?: string;
    action?: AuditLogAction;
    limit?: number;
};

export interface IAuditLogRepository {
    create(entity: AuditLogEntity): Promise<AuditLogEntity>;
    findMany(filter: AuditLogFilter): Promise<AuditLogEntity[]>;
}
