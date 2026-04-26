import { Inject, Injectable, Logger } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { BETTER_AUTH } from '../../../auth/constants';
import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';

@Injectable()
export class AdminSendPasswordResetUseCase {
    private readonly logger = new Logger(AdminSendPasswordResetUseCase.name);

    constructor(
        private readonly users: AdminUserService,
        private readonly audit: AuditLogService,
        @Inject(BETTER_AUTH) private readonly auth: any,
    ) {}

    async execute(
        targetUserId: string,
        actorUserId: string,
    ): Promise<{ ok: true; email: string }> {
        const target = await this.users.getById(targetUserId);
        if (target.banned && target.banReason === 'ACCOUNT_DELETED') {
            throw new UnprocessableDomainException(
                'cannot send reset for a deleted account',
            );
        }
        const redirectTo = `${process.env.APP_URL ?? ''}/reset-password`;
        try {
            await this.auth.api.requestPasswordReset({
                body: { email: target.email, redirectTo },
                asResponse: false,
            });
        } catch (err: any) {
            this.logger.warn(
                `requestPasswordReset for ${target.email} (admin-triggered) failed: ${err?.message ?? 'unknown'}`,
            );
            throw new UnprocessableDomainException(
                'could not trigger password reset email',
            );
        }
        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'user.password_reset_sent',
                targetType: 'user',
                targetId: targetUserId,
                metadata: { email: target.email },
            })
            .catch(() => undefined);
        return { ok: true, email: target.email };
    }
}
