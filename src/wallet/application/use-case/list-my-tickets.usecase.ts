import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../events/domain/repositories/ticket-section.repository';
import { IVenueRepository } from '../../../venues/domain/repositories/venue.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { ICheckinRepository } from '../../../tickets/domain/repositories/checkin.repository';
import { WalletTicketView } from '../types/wallet-ticket-view';
import { decorateTicket } from './helpers/decorate-ticket';

export class ListMyTicketsUseCase {
    constructor(
        private readonly ticketRepo: ITicketRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly venueRepo: IVenueRepository,
        private readonly checkinRepo: ICheckinRepository,
        private readonly platformDefaultHoursBefore: number,
    ) {}

    async execute(userId: string): Promise<WalletTicketView[]> {
        const tickets = await this.ticketRepo.findByOwner(userId);
        const views: WalletTicketView[] = [];
        for (const t of tickets) {
            const view = await decorateTicket(t, {
                eventRepo: this.eventRepo,
                sessionRepo: this.sessionRepo,
                sectionRepo: this.sectionRepo,
                venueRepo: this.venueRepo,
                checkinRepo: this.checkinRepo,
                platformDefaultHoursBefore:
                    this.platformDefaultHoursBefore,
            });
            if (view) views.push(view);
        }
        return views;
    }
}
