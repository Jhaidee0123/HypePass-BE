import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { assertEventInCompany } from './helpers/assert-event-ownership';

/**
 * Organizer-scoped event delete. Allowed in any status, but blocked if
 * any tickets have already been issued (paid or courtesy) — preserving
 * the financial trail. The organizer must refund / cancel orders out of
 * band before deletion.
 *
 * Deleting a published event sends it back to a state where, if recreated,
 * it has to go through admin review again. The FE warns the user about
 * this before confirming.
 */
export class DeleteEventUseCase {
    constructor(
        private readonly repo: IEventRepository,
        private readonly tickets: ITicketRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        actorUserId: string,
    ): Promise<void> {
        const event = await assertEventInCompany(
            this.repo,
            companyId,
            eventId,
        );

        const ticketCount = await this.tickets.countByEvent(event.id);
        if (ticketCount > 0) {
            throw new UnprocessableDomainException(
                `Cannot delete event: ${ticketCount} ticket(s) already issued. Refund/cancel orders first.`,
                'EVENT_HAS_TICKETS',
            );
        }

        await this.repo.delete(eventId);

        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'event.deleted',
                targetType: 'event',
                targetId: event.id,
                metadata: {
                    title: event.title,
                    slug: event.slug,
                    companyId: event.companyId,
                    previousStatus: event.status,
                    deletedBy: 'organizer',
                },
            })
            .catch(() => undefined);
    }
}
