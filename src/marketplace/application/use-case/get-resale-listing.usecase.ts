import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../events/domain/repositories/ticket-section.repository';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { PublicResaleListingView } from './list-active-resale-listings.usecase';

export class GetResaleListingUseCase {
    constructor(
        private readonly listingRepo: IResaleListingRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
    ) {}

    async execute(listingId: string): Promise<PublicResaleListingView> {
        const listing = await this.listingRepo.findById(listingId);
        if (!listing) {
            throw new NotFoundDomainException('Listing not found');
        }
        const ticket = await this.ticketRepo.findById(listing.ticketId);
        if (!ticket) throw new NotFoundDomainException('Ticket missing');
        const event = await this.eventRepo.findById(ticket.eventId);
        const session = await this.sessionRepo.findById(ticket.eventSessionId);
        const section = await this.sectionRepo.findById(ticket.ticketSectionId);
        if (!event || !session || !section) {
            throw new NotFoundDomainException('Listing context missing');
        }
        return {
            listing,
            event: {
                id: event.id,
                title: event.title,
                slug: event.slug,
                coverImageUrl: event.coverImageUrl ?? null,
            },
            session: {
                id: session.id,
                startsAt: session.startsAt.toISOString(),
                endsAt: session.endsAt.toISOString(),
            },
            section: {
                id: section.id,
                name: section.name,
            },
            ticketFaceValue: ticket.faceValue,
        };
    }
}
