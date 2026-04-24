import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { AuditActorKind, AuditLogAction } from '../../domain/types/audit-log-action';

@Entity({ name: 'audit_logs' })
export class AuditLogOrmEntity extends BaseOrmEntity {
    @Index()
    @Column({ type: 'varchar', length: 10, name: 'actor_kind' })
    actorKind: AuditActorKind;

    @Index()
    @Column('text', { name: 'actor_user_id', nullable: true })
    actorUserId: string | null;

    @Index()
    @Column({ type: 'varchar', length: 60 })
    action: AuditLogAction;

    @Index()
    @Column({ type: 'varchar', length: 40, name: 'target_type' })
    targetType: string;

    @Index()
    @Column({ type: 'varchar', length: 80, name: 'target_id' })
    targetId: string;

    @Column('jsonb', { nullable: true })
    metadata: Record<string, any> | null;
}
