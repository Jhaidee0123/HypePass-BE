import { CategoryEntity } from '../../../../categories/domain/entities/category.entity';
import { VenueEntity } from '../../../../venues/domain/entities/venue.entity';
import { EventEntity } from '../../../domain/entities/event.entity';
import { EventSessionEntity } from '../../../domain/entities/event-session.entity';
import { TicketSectionEntity } from '../../../domain/entities/ticket-section.entity';
import { TicketSalePhaseEntity } from '../../../domain/entities/ticket-sale-phase.entity';

/** Flat, consumer-friendly shape used in the public list. */
export type PublicEventListItem = {
    id: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    coverImageUrl: string | null;
    bannerImageUrl: string | null;
    category: { id: string; slug: string; name: string } | null;
    venue: {
        id: string;
        name: string;
        city: string;
        country: string;
    } | null;
    /** Free-form location captured by the organizer (newer events). */
    location: {
        name: string | null;
        address: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
    nextSessionStartsAt: string | null;
    fromPrice: number | null;
    currency: string;
    onSale: boolean;
    totalSessions: number;
};

/** Full detail shape for the public event page. */
export type PublicEventDetail = {
    event: EventEntity;
    category: CategoryEntity | null;
    venue: VenueEntity | null;
    sessions: Array<
        EventSessionEntity & {
            sections: Array<
                TicketSectionEntity & {
                    phases: Array<
                        TicketSalePhaseEntity & { isOpenNow: boolean }
                    >;
                    currentPhase: TicketSalePhaseEntity | null;
                }
            >;
        }
    >;
};
