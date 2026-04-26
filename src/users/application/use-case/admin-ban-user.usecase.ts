import { Injectable } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { BanUserDto } from '../dto/ban-user.dto';
import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';

@Injectable()
export class AdminBanUserUseCase {
    constructor(
        private readonly users: AdminUserService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(targetUserId: string, dto: BanUserDto, actorUserId: string) {
        if (targetUserId === actorUserId) {
            throw new UnprocessableDomainException('admins cannot ban themselves');
        }
        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        const updated = await this.users.ban(targetUserId, dto.reason, expiresAt);
        void this.audit.record({
            action: 'user.banned',
            actorUserId,
            targetType: 'user',
            targetId: targetUserId,
            metadata: { reason: dto.reason, expiresAt: dto.expiresAt ?? null },
        });
        return updated;
    }
}

@Injectable()
export class AdminUnbanUserUseCase {
    constructor(
        private readonly users: AdminUserService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(targetUserId: string, actorUserId: string) {
        const updated = await this.users.unban(targetUserId);
        void this.audit.record({
            action: 'user.unbanned',
            actorUserId,
            targetType: 'user',
            targetId: targetUserId,
            metadata: null,
        });
        return updated;
    }
}
