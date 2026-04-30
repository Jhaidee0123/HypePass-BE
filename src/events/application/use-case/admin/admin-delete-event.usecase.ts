import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { ITicketRepository } from '../../../../tickets/domain/repositories/ticket.repository';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';

/**
 * Platform-admin event delete. Same financial-trail guard as the organizer
 * version (blocked when tickets exist), but does NOT require the event to
 * belong to a particular company — admin can act across any tenant.
 */
export class AdminDeleteEventUseCase {
    constructor(
        private readonly events: IEventRepository,
        private readonly tickets: ITicketRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(eventId: string, actorUserId: string): Promise<void> {
        const event = await this.events.findById(eventId);
        if (!event) {
            throw new NotFoundDomainException('Event not found');
        }

        const ticketCount = await this.tickets.countByEvent(event.id);
        if (ticketCount > 0) {
            throw new UnprocessableDomainException(
                `Cannot delete event: ${ticketCount} ticket(s) already issued. Refund/cancel orders first.`,
                'EVENT_HAS_TICKETS',
            );
        }

        await this.events.delete(event.id);

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
                    deletedBy: 'admin',
                },
            })
            .catch(() => undefined);
    }
}
