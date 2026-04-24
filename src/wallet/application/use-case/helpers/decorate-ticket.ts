import { IEventRepository } from '../../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../../events/domain/repositories/ticket-section.repository';
import { IVenueRepository } from '../../../../venues/domain/repositories/venue.repository';
import { TicketEntity } from '../../../../tickets/domain/entities/ticket.entity';
import { ICheckinRepository } from '../../../../tickets/domain/repositories/checkin.repository';
import { computeQrVisibleFrom } from '../../../../tickets/domain/helpers/qr-visibility';
import { WalletTicketView } from '../../types/wallet-ticket-view';

/**
 * Takes a ticket and hydrates it with event/session/section/venue info + the
 * computed QR visibility timestamp. Small cost (a handful of point queries).
 */
export async function decorateTicket(
    ticket: TicketEntity,
    deps: {
        eventRepo: IEventRepository;
        sessionRepo: IEventSessionRepository;
        sectionRepo: ITicketSectionRepository;
        venueRepo: IVenueRepository;
        checkinRepo: ICheckinRepository;
        platformDefaultHoursBefore: number;
    },
    now: Date = new Date(),
): Promise<WalletTicketView | null> {
    const event = await deps.eventRepo.findById(ticket.eventId);
    const session = await deps.sessionRepo.findById(ticket.eventSessionId);
    const section = await deps.sectionRepo.findById(ticket.ticketSectionId);
    if (!event || !session || !section) return null;

    const venue = event.venueId
        ? await deps.venueRepo.findById(event.venueId)
        : null;
    const accepted = await deps.checkinRepo.findAcceptedByTicket(ticket.id);

    const qrVisibleFrom = computeQrVisibleFrom(
        session,
        event,
        deps.platformDefaultHoursBefore,
    );

    return {
        ticket,
        event: {
            id: event.id,
            slug: event.slug,
            title: event.title,
            coverImageUrl: event.coverImageUrl ?? null,
        },
        session: {
            id: session.id,
            name: session.name ?? null,
            startsAt: session.startsAt.toISOString(),
            endsAt: session.endsAt.toISOString(),
            timezone: session.timezone,
            qrVisibleFrom: qrVisibleFrom.toISOString(),
        },
        section: { id: section.id, name: section.name },
        venue: venue
            ? {
                  id: venue.id,
                  name: venue.name,
                  city: venue.city,
                  country: venue.country,
              }
            : null,
        qrVisibleNow: now.getTime() >= qrVisibleFrom.getTime(),
        checkedInAt: accepted?.scannedAt.toISOString() ?? null,
    };
}
