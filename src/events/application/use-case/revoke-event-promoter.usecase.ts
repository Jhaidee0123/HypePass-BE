import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventPromoterService } from '../services/event-promoter.service';
import { EventPromoterEntity } from '../../domain/entities/event-promoter.entity';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class RevokeEventPromoterUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly promoterService: EventPromoterService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        userId: string,
        actorUserId: string,
    ): Promise<void> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        const existing = await this.promoterService.findActiveByEventAndUser(
            event.id,
            userId,
        );
        if (!existing) {
            throw new NotFoundDomainException(
                'Active promoter not found for this event',
            );
        }
        await this.promoterService.update(
            new EventPromoterEntity({
                id: existing.id,
                eventId: existing.eventId,
                userId: existing.userId,
                referralCode: existing.referralCode,
                assignedByUserId: existing.assignedByUserId,
                note: existing.note,
                revokedAt: new Date(),
                createdAt: existing.createdAt,
                updatedAt: new Date(),
            }),
        );
        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'promoter.revoked',
                targetType: 'event',
                targetId: event.id,
                metadata: {
                    promoterUserId: userId,
                    referralCode: existing.referralCode,
                },
            })
            .catch(() => undefined);
    }
}
