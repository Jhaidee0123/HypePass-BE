import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { IInventoryHoldRepository } from '../../../tickets/domain/repositories/inventory-hold.repository';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { assertEventInCompany } from './helpers/assert-event-ownership';

/**
 * Ticket statuses that count against the "sold" capacity. A ticket that is
 * voided, refunded or expired does not consume an inventory slot.
 */
const SOLD_STATUSES: TicketStatus[] = [
    TicketStatus.ISSUED,
    TicketStatus.LISTED,
    TicketStatus.RESERVED_FOR_RESALE,
    TicketStatus.TRANSFERRED,
    TicketStatus.CHECKED_IN,
];

export type SalesSummaryTotals = {
    capacity: number;
    sold: number;
    checkedIn: number;
    reserved: number;
    courtesies: number;
    available: number;
    grossRevenue: number;
    currency: string;
};

export type SalesSummarySectionRow = {
    id: string;
    name: string;
    sortOrder: number;
    capacity: number;
    sold: number;
    checkedIn: number;
    reserved: number;
    courtesies: number;
    available: number;
    grossRevenue: number;
    currency: string;
};

export type SalesSummarySessionRow = {
    id: string;
    name: string | null;
    startsAt: Date;
    endsAt: Date;
    totals: SalesSummaryTotals;
    sections: SalesSummarySectionRow[];
};

export type SalesSummaryResponse = {
    event: {
        id: string;
        title: string;
        currency: string;
    };
    sessions: SalesSummarySessionRow[];
    totals: SalesSummaryTotals;
    generatedAt: Date;
};

export class GetEventSalesSummaryUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly holdRepo: IInventoryHoldRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
    ): Promise<SalesSummaryResponse> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        const sessions = await this.sessionRepo.findByEvent(event.id);
        const sessionIds = sessions.map((s) => s.id);

        const sectionsBySession = new Map<string, Array<{
            id: string;
            name: string;
            sortOrder: number;
            capacity: number;
            eventSessionId: string;
        }>>();
        const allSectionIds: string[] = [];

        for (const session of sessions) {
            const sections = await this.sectionRepo.findByEventSession(
                session.id,
            );
            const mapped = sections.map((s) => ({
                id: s.id,
                name: s.name,
                sortOrder: s.sortOrder,
                capacity: s.totalInventory,
                eventSessionId: s.eventSessionId,
            }));
            sectionsBySession.set(session.id, mapped);
            for (const s of mapped) allSectionIds.push(s.id);
        }

        const [statusBreakdown, activeHolds] = await Promise.all([
            this.ticketRepo.groupBySectionAndStatus(allSectionIds),
            this.holdRepo.sumActiveForSections(allSectionIds, new Date()),
        ]);

        // Index by section
        const bySection = new Map<
            string,
            {
                sold: number;
                checkedIn: number;
                courtesies: number;
                grossRevenue: number;
            }
        >();
        for (const sid of allSectionIds) {
            bySection.set(sid, {
                sold: 0,
                checkedIn: 0,
                courtesies: 0,
                grossRevenue: 0,
            });
        }
        for (const row of statusBreakdown) {
            const entry = bySection.get(row.ticketSectionId);
            if (!entry) continue;
            if (SOLD_STATUSES.includes(row.status)) {
                entry.sold += row.count;
                // Courtesy tickets have face_value=0 so they don't bias
                // grossRevenue, but we keep the guard explicit for clarity.
                if (!row.courtesy) {
                    entry.grossRevenue += row.faceValueSum;
                }
                if (row.courtesy) {
                    entry.courtesies += row.count;
                }
            }
            if (row.status === TicketStatus.CHECKED_IN) {
                entry.checkedIn += row.count;
            }
        }
        const reservedBySection = new Map<string, number>();
        for (const row of activeHolds) {
            reservedBySection.set(row.ticketSectionId, row.quantity);
        }

        // Build response
        const sessionRows: SalesSummarySessionRow[] = sessions.map((session) => {
            const sections = sectionsBySession.get(session.id) ?? [];
            const sectionRows: SalesSummarySectionRow[] = sections
                .map((s) => {
                    const counts = bySection.get(s.id) ?? {
                        sold: 0,
                        checkedIn: 0,
                        courtesies: 0,
                        grossRevenue: 0,
                    };
                    const reserved = reservedBySection.get(s.id) ?? 0;
                    const available = Math.max(
                        s.capacity - counts.sold - reserved,
                        0,
                    );
                    return {
                        id: s.id,
                        name: s.name,
                        sortOrder: s.sortOrder,
                        capacity: s.capacity,
                        sold: counts.sold,
                        checkedIn: counts.checkedIn,
                        reserved,
                        courtesies: counts.courtesies,
                        available,
                        grossRevenue: counts.grossRevenue,
                        currency: event.currency,
                    };
                })
                .sort((a, b) =>
                    a.sortOrder === b.sortOrder
                        ? a.name.localeCompare(b.name)
                        : a.sortOrder - b.sortOrder,
                );

            const sessionTotals: SalesSummaryTotals = sectionRows.reduce(
                (acc, s) => ({
                    capacity: acc.capacity + s.capacity,
                    sold: acc.sold + s.sold,
                    checkedIn: acc.checkedIn + s.checkedIn,
                    reserved: acc.reserved + s.reserved,
                    courtesies: acc.courtesies + s.courtesies,
                    available: acc.available + s.available,
                    grossRevenue: acc.grossRevenue + s.grossRevenue,
                    currency: event.currency,
                }),
                {
                    capacity: 0,
                    sold: 0,
                    checkedIn: 0,
                    reserved: 0,
                    courtesies: 0,
                    available: 0,
                    grossRevenue: 0,
                    currency: event.currency,
                },
            );

            return {
                id: session.id,
                name: session.name ?? null,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                totals: sessionTotals,
                sections: sectionRows,
            };
        });

        const eventTotals: SalesSummaryTotals = sessionRows.reduce(
            (acc, s) => ({
                capacity: acc.capacity + s.totals.capacity,
                sold: acc.sold + s.totals.sold,
                checkedIn: acc.checkedIn + s.totals.checkedIn,
                reserved: acc.reserved + s.totals.reserved,
                courtesies: acc.courtesies + s.totals.courtesies,
                available: acc.available + s.totals.available,
                grossRevenue: acc.grossRevenue + s.totals.grossRevenue,
                currency: event.currency,
            }),
            {
                capacity: 0,
                sold: 0,
                checkedIn: 0,
                reserved: 0,
                courtesies: 0,
                available: 0,
                grossRevenue: 0,
                currency: event.currency,
            },
        );

        // quiet unused var warning for sessionIds (kept for clarity)
        void sessionIds;

        return {
            event: {
                id: event.id,
                title: event.title,
                currency: event.currency,
            },
            sessions: sessionRows,
            totals: eventTotals,
            generatedAt: new Date(),
        };
    }
}
