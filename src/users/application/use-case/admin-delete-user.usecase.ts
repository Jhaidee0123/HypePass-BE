import { Injectable } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';

@Injectable()
export class AdminDeleteUserUseCase {
    constructor(
        private readonly users: AdminUserService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(targetUserId: string, actorUserId: string) {
        if (targetUserId === actorUserId) {
            throw new UnprocessableDomainException(
                'admins cannot delete themselves',
            );
        }
        const before = await this.users.getById(targetUserId);
        const updated = await this.users.softDelete(targetUserId);
        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'user.deleted',
                targetType: 'user',
                targetId: targetUserId,
                metadata: {
                    formerEmail: before.email,
                    formerName: before.name,
                },
            })
            .catch(() => undefined);
        return updated;
    }
}
