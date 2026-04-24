import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../events/domain/repositories/ticket-section.repository';
import { IVenueRepository } from '../../../venues/domain/repositories/venue.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { ICheckinRepository } from '../../../tickets/domain/repositories/checkin.repository';
import { WalletTicketView } from '../types/wallet-ticket-view';
import { decorateTicket } from './helpers/decorate-ticket';

export class GetMyTicketUseCase {
    constructor(
        private readonly ticketRepo: ITicketRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly venueRepo: IVenueRepository,
        private readonly checkinRepo: ICheckinRepository,
        private readonly platformDefaultHoursBefore: number,
    ) {}

    async execute(
        userId: string,
        ticketId: string,
    ): Promise<WalletTicketView> {
        const ticket = await this.ticketRepo.findById(ticketId);
        if (!ticket) throw new NotFoundDomainException('Ticket not found');
        if (ticket.currentOwnerUserId !== userId) {
            throw new ForbiddenDomainException(
                'This ticket is not in your wallet',
            );
        }
        const view = await decorateTicket(ticket, {
            eventRepo: this.eventRepo,
            sessionRepo: this.sessionRepo,
            sectionRepo: this.sectionRepo,
            venueRepo: this.venueRepo,
            checkinRepo: this.checkinRepo,
            platformDefaultHoursBefore: this.platformDefaultHoursBefore,
        });
        if (!view) throw new NotFoundDomainException('Ticket context missing');
        return view;
    }
}
