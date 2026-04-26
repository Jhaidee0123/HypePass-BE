import { Injectable } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';

@Injectable()
export class AdminSetUserRoleUseCase {
    constructor(
        private readonly users: AdminUserService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        targetUserId: string,
        nextRole: 'user' | 'platform_admin',
        actorUserId: string,
    ) {
        if (targetUserId === actorUserId && nextRole !== 'platform_admin') {
            throw new UnprocessableDomainException(
                'admins cannot demote themselves',
            );
        }
        const before = await this.users.getById(targetUserId);
        const updated = await this.users.setRole(targetUserId, nextRole);
        void this.audit.record({
            action: 'user.role_changed',
            actorUserId,
            targetType: 'user',
            targetId: targetUserId,
            metadata: { from: before.role, to: nextRole },
        });
        return updated;
    }
}
