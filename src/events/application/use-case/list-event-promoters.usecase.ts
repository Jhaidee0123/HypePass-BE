import { DataSource } from 'typeorm';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventPromoterService } from '../services/event-promoter.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export type EventPromoterRow = {
    id: string;
    userId: string;
    email: string;
    name: string;
    referralCode: string;
    note: string | null;
    revokedAt: string | null;
    createdAt: string;
    ticketsSold: number;
    ordersCount: number;
    grossRevenue: number;
    currency: string;
};

/**
 * Organizer view: lists every promoter for an event (active + revoked) and
 * aggregates tickets + revenue attributed to each code via the orders table.
 */
export class ListEventPromotersUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly promoterService: EventPromoterService,
        private readonly userRepo: IUserRepository,
        private readonly ds: DataSource,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
    ): Promise<EventPromoterRow[]> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        const promoters = await this.promoterService.findByEvent(event.id);
        if (promoters.length === 0) return [];

        const codes = promoters.map((p) => p.referralCode);

        const stats = await this.ds.query<
            Array<{
                code: string;
                tickets_sold: string;
                orders_count: string;
                gross_revenue: string;
                currency: string | null;
            }>
        >(
            // CTE pattern avoids the classic JOIN+SUM duplication bug:
            // joining tickets multiplies o.grand_total by the ticket count.
            // We collect ticket counts per order in a subquery so each order
            // contributes its grand_total exactly once to the sum.
            `WITH order_stats AS (
                SELECT
                    o.id,
                    o.promoter_referral_code AS code,
                    o.grand_total,
                    o.currency,
                    (
                        SELECT COUNT(t.id)
                        FROM order_items oi
                        LEFT JOIN tickets t ON t.order_item_id = oi.id
                        WHERE oi.order_id = o.id
                    ) AS ticket_count
                FROM orders o
                WHERE o.promoter_referral_code = ANY($1)
                  AND o.status = 'paid'
            )
            SELECT
                code,
                COUNT(*)::text AS orders_count,
                COALESCE(SUM(grand_total), 0)::text AS gross_revenue,
                COALESCE(SUM(ticket_count), 0)::text AS tickets_sold,
                MAX(currency) AS currency
            FROM order_stats
            GROUP BY code`,
            [codes],
        );

        const byCode = new Map<
            string,
            { ticketsSold: number; ordersCount: number; grossRevenue: number; currency: string }
        >();
        for (const s of stats) {
            byCode.set(s.code, {
                ticketsSold: Number(s.tickets_sold),
                ordersCount: Number(s.orders_count),
                grossRevenue: Number(s.gross_revenue),
                currency: s.currency ?? event.currency,
            });
        }

        // Resolve user info in parallel.
        const users = await Promise.all(
            promoters.map((p) => this.userRepo.findById(p.userId)),
        );

        const rows: EventPromoterRow[] = promoters.map((p, idx) => {
            const user = users[idx];
            const stat = byCode.get(p.referralCode);
            return {
                id: p.id,
                userId: p.userId,
                email: user?.email ?? '',
                name: user?.name ?? '—',
                referralCode: p.referralCode,
                note: p.note,
                revokedAt: p.revokedAt ? p.revokedAt.toISOString() : null,
                createdAt: p.createdAt.toISOString(),
                ticketsSold: stat?.ticketsSold ?? 0,
                ordersCount: stat?.ordersCount ?? 0,
                grossRevenue: stat?.grossRevenue ?? 0,
                currency: stat?.currency ?? event.currency,
            };
        });
        return rows;
    }
}
