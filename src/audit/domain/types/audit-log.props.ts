import { BaseProps } from '../../../shared/domain/types/base.props';
import { AuditActorKind, AuditLogAction } from './audit-log-action';

export type AuditLogProps = BaseProps & {
    actorKind: AuditActorKind;
    actorUserId?: string | null;
    action: AuditLogAction;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown> | null;
};
