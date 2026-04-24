import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../events/domain/repositories/ticket-section.repository';
import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';

export type PublicResaleListingView = {
    listing: ResaleListingEntity;
    event: {
        id: string;
        title: string;
        slug: string;
        coverImageUrl: string | null;
    };
    session: {
        id: string;
        startsAt: string;
        endsAt: string;
    };
    section: {
        id: string;
        name: string;
    };
    ticketFaceValue: number;
};

/**
 * Public marketplace feed. Returns ACTIVE listings enriched with the
 * event/session/section context needed for the FE grid + detail cards.
 */
export class ListActiveResaleListingsUseCase {
    constructor(
        private readonly listingRepo: IResaleListingRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
    ) {}

    async execute(): Promise<PublicResaleListingView[]> {
        const listings = await this.listingRepo.findByStatuses([
            ResaleListingStatus.ACTIVE,
        ]);

        const views: PublicResaleListingView[] = [];
        for (const listing of listings) {
            const ticket = await this.ticketRepo.findById(listing.ticketId);
            if (!ticket) continue;
            const event = await this.eventRepo.findById(ticket.eventId);
            const session = await this.sessionRepo.findById(
                ticket.eventSessionId,
            );
            const section = await this.sectionRepo.findById(
                ticket.ticketSectionId,
            );
            if (!event || !session || !section) continue;

            views.push({
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
            });
        }

        return views;
    }
}
