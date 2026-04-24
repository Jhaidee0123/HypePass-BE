import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventStaffRepository } from '../../domain/repositories/event-staff.repository';
import { assertEventInCompany } from './helpers/assert-event-ownership';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

/**
 * Removes every staff assignment (across roles) for a given user on a given
 * event. The organizer revokes access holistically — "Juan is no longer
 * staff of this event", not "remove only the checkin role".
 */
export class RevokeEventStaffUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly staffRepo: IEventStaffRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        targetUserId: string,
        actorUserId: string,
    ): Promise<{ revokedCount: number }> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        const existing = await this.staffRepo.findByEventAndUser(
            event.id,
            targetUserId,
        );
        if (existing.length === 0) {
            throw new NotFoundDomainException(
                'User is not assigned as staff for this event',
            );
        }
        for (const a of existing) {
            await this.staffRepo.delete(a.id);
        }
        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'staff.revoked',
                targetType: 'event',
                targetId: event.id,
                metadata: {
                    targetUserId,
                    roles: existing.map((a) => a.role),
                },
            })
            .catch(() => undefined);
        return { revokedCount: existing.length };
    }
}
