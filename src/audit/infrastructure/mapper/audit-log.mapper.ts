import { AuditLogEntity } from '../../domain/entities/audit-log.entity';
import { AuditLogOrmEntity } from '../orm/audit-log.orm.entity';

export class AuditLogMapper {
    static toDomain(orm: AuditLogOrmEntity): AuditLogEntity {
        return new AuditLogEntity({
            id: orm.id,
            actorKind: orm.actorKind,
            actorUserId: orm.actorUserId,
            action: orm.action,
            targetType: orm.targetType,
            targetId: orm.targetId,
            metadata: orm.metadata,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: AuditLogEntity): Partial<AuditLogOrmEntity> {
        return {
            id: entity.id,
            actorKind: entity.actorKind,
            actorUserId: entity.actorUserId ?? null,
            action: entity.action,
            targetType: entity.targetType,
            targetId: entity.targetId,
            metadata: (entity.metadata as Record<string, any>) ?? null,
        };
    }
}
