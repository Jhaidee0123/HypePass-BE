import { ICategoryRepository } from '../../../../categories/domain/repositories/category.repository';
import { IVenueRepository } from '../../../../venues/domain/repositories/venue.repository';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../../domain/repositories/ticket-sale-phase.repository';
import { EventStatus } from '../../../domain/types/event-status';
import {
    PublicEventQueryDto,
    PublicEventSort,
} from '../../dto/public-event-query.dto';
import { PublicEventListItem } from './public-event-types';

const UUID_RX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lowercase + strip diacritics so "Bogotá" and "bogota" match. */
function normalizeCity(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
}

export type PublicEventListResult = {
    items: PublicEventListItem[];
    total: number;
    page: number;
    pageSize: number;
};

export class ListPublicEventsUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
        private readonly categoryRepo: ICategoryRepository,
        private readonly venueRepo: IVenueRepository,
    ) {}

    async execute(
        query: PublicEventQueryDto,
    ): Promise<PublicEventListResult> {
        const all = await this.eventRepo.findAll({
            status: EventStatus.PUBLISHED,
            search: query.search,
        });

        // Category filter (accept slug or id). Guard findById behind a UUID
        // regex — Postgres throws 22P02 `invalid input syntax for type uuid`
        // before we can fall back to findBySlug if we hand it a slug string.
        let categoryId: string | undefined;
        if (query.category) {
            if (UUID_RX.test(query.category)) {
                const byId = await this.categoryRepo.findById(query.category);
                if (byId) categoryId = byId.id;
            }
            if (!categoryId) {
                const bySlug = await this.categoryRepo.findBySlug(
                    query.category,
                );
                if (bySlug) categoryId = bySlug.id;
            }
        }

        const now = new Date();
        const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
        const dateTo = query.dateTo ? new Date(query.dateTo) : null;

        // City filter is a forgiving "contains" match: lowercase + strip
        // diacritics so "Bogo" finds "Bogotá" and "medellin" finds "Medellín".
        const cityNeedle = query.city ? normalizeCity(query.city) : null;

        const items: PublicEventListItem[] = [];
        for (const event of all) {
            if (query.companyId && event.companyId !== query.companyId)
                continue;
            if (categoryId && event.categoryId !== categoryId) continue;

            const venue = event.venueId
                ? await this.venueRepo.findById(event.venueId)
                : null;
            if (cityNeedle) {
                const haystack = venue?.city
                    ? normalizeCity(venue.city)
                    : '';
                if (!haystack.includes(cityNeedle)) continue;
            }

            const sessions = await this.sessionRepo.findByEvent(event.id);
            const upcoming = sessions
                .filter((s) => s.endsAt.getTime() > now.getTime())
                .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
            if (upcoming.length === 0) continue; // event has no future session

            const nextSession = upcoming[0];
            if (dateFrom && nextSession.startsAt.getTime() < dateFrom.getTime())
                continue;
            if (dateTo && nextSession.startsAt.getTime() > dateTo.getTime())
                continue;

            // Compute cheapest upcoming phase across all upcoming sessions +
            // sections + phases, AND whether any phase is active right now.
            let cheapest: number | null = null;
            let onSale = false;
            for (const session of upcoming) {
                const sections =
                    await this.sectionRepo.findByEventSession(session.id);
                for (const section of sections) {
                    const phases = await this.phaseRepo.findBySection(
                        section.id,
                    );
                    for (const p of phases) {
                        if (!p.isActive) continue;
                        if (p.endsAt.getTime() <= now.getTime()) continue;
                        if (cheapest === null || p.price < cheapest) {
                            cheapest = p.price;
                        }
                        if (p.startsAt.getTime() <= now.getTime()) {
                            onSale = true;
                        }
                    }
                }
            }

            if (query.onSale === true && !onSale) continue;
            if (
                query.minPrice !== undefined &&
                (cheapest === null || cheapest < query.minPrice)
            )
                continue;
            if (
                query.maxPrice !== undefined &&
                (cheapest === null || cheapest > query.maxPrice)
            )
                continue;

            const category = event.categoryId
                ? await this.categoryRepo.findById(event.categoryId)
                : null;

            items.push({
                id: event.id,
                slug: event.slug,
                title: event.title,
                shortDescription: event.shortDescription ?? null,
                coverImageUrl: event.coverImageUrl ?? null,
                bannerImageUrl: event.bannerImageUrl ?? null,
                category: category
                    ? {
                          id: category.id,
                          slug: category.slug,
                          name: category.name,
                      }
                    : null,
                venue: venue
                    ? {
                          id: venue.id,
                          name: venue.name,
                          city: venue.city,
                          country: venue.country,
                      }
                    : null,
                location:
                    event.locationName ||
                    event.locationAddress ||
                    event.locationLatitude !== null
                        ? {
                              name: event.locationName ?? null,
                              address: event.locationAddress ?? null,
                              latitude: event.locationLatitude ?? null,
                              longitude: event.locationLongitude ?? null,
                          }
                        : null,
                nextSessionStartsAt: nextSession.startsAt.toISOString(),
                fromPrice: cheapest,
                currency: event.currency,
                onSale,
                totalSessions: upcoming.length,
            });
        }

        const sorted = sortItems(items, query.sort ?? 'soonest', all);

        const page = Math.max(1, query.page ?? 1);
        const pageSize = Math.max(1, query.pageSize ?? 24);
        const start = (page - 1) * pageSize;
        const paged = sorted.slice(start, start + pageSize);

        return { items: paged, total: sorted.length, page, pageSize };
    }
}

function sortItems(
    items: PublicEventListItem[],
    sort: PublicEventSort,
    allForNewest: { id: string; createdAt?: Date }[],
): PublicEventListItem[] {
    const createdAtMap = new Map<string, number>();
    for (const e of allForNewest) {
        createdAtMap.set(e.id, e.createdAt?.getTime() ?? 0);
    }

    return [...items].sort((a, b) => {
        switch (sort) {
            case 'newest': {
                return (
                    (createdAtMap.get(b.id) ?? 0) -
                    (createdAtMap.get(a.id) ?? 0)
                );
            }
            case 'priceAsc': {
                const av = a.fromPrice ?? Number.POSITIVE_INFINITY;
                const bv = b.fromPrice ?? Number.POSITIVE_INFINITY;
                return av - bv;
            }
            case 'priceDesc': {
                const av = a.fromPrice ?? Number.NEGATIVE_INFINITY;
                const bv = b.fromPrice ?? Number.NEGATIVE_INFINITY;
                return bv - av;
            }
            case 'soonest':
            default: {
                const av = a.nextSessionStartsAt
                    ? new Date(a.nextSessionStartsAt).getTime()
                    : Number.POSITIVE_INFINITY;
                const bv = b.nextSessionStartsAt
                    ? new Date(b.nextSessionStartsAt).getTime()
                    : Number.POSITIVE_INFINITY;
                return av - bv;
            }
        }
    });
}
