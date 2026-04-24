import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { AuditActorKind, AuditLogAction } from '../types/audit-log-action';
import { AuditLogProps } from '../types/audit-log.props';

export class AuditLogEntity extends BaseEntity {
    readonly actorKind: AuditActorKind;
    readonly actorUserId?: string | null;
    readonly action: AuditLogAction;
    readonly targetType: string;
    readonly targetId: string;
    readonly metadata?: Record<string, unknown> | null;

    constructor(props: AuditLogProps) {
        super(props);
        this.actorKind = props.actorKind;
        this.actorUserId = props.actorUserId ?? null;
        this.action = props.action;
        this.targetType = props.targetType;
        this.targetId = props.targetId;
        this.metadata = props.metadata ?? null;
    }
}
