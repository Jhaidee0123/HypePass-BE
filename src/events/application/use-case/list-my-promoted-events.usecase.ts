import { DataSource } from 'typeorm';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventPromoterService } from '../services/event-promoter.service';

export type MyPromotedEventRow = {
    eventId: string;
    title: string;
    slug: string;
    status: string;
    coverImageUrl: string | null;
    referralCode: string;
    revokedAt: string | null;
    referralLink: string;
    ticketsSold: number;
    ordersCount: number;
    grossRevenue: number;
    currency: string;
};

/**
 * Promoter view: every event where the calling user is (or was) a promoter
 * + per-event sales aggregates attributed to their code.
 */
export class ListMyPromotedEventsUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly promoterService: EventPromoterService,
        private readonly ds: DataSource,
    ) {}

    async execute(userId: string): Promise<MyPromotedEventRow[]> {
        const active = await this.promoterService.findActiveByUser(userId);
        const historical =
            await this.promoterService.findHistoricalByUser(userId);
        const promoters = [...active, ...historical];
        if (promoters.length === 0) return [];

        const events = await Promise.all(
            promoters.map((p) => this.eventRepo.findById(p.eventId)),
        );

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
            { ticketsSold: number; ordersCount: number; grossRevenue: number; currency: string | null }
        >();
        for (const s of stats) {
            byCode.set(s.code, {
                ticketsSold: Number(s.tickets_sold),
                ordersCount: Number(s.orders_count),
                grossRevenue: Number(s.gross_revenue),
                currency: s.currency,
            });
        }

        const appUrl = process.env.APP_URL ?? '';
        const rows: MyPromotedEventRow[] = [];
        promoters.forEach((p, idx) => {
            const ev = events[idx];
            if (!ev) return;
            const stat = byCode.get(p.referralCode);
            rows.push({
                eventId: ev.id,
                title: ev.title,
                slug: ev.slug,
                status: ev.status,
                coverImageUrl: ev.coverImageUrl ?? null,
                referralCode: p.referralCode,
                revokedAt: p.revokedAt ? p.revokedAt.toISOString() : null,
                referralLink: `${appUrl}/events/${ev.slug}?ref=${p.referralCode}`,
                ticketsSold: stat?.ticketsSold ?? 0,
                ordersCount: stat?.ordersCount ?? 0,
                grossRevenue: stat?.grossRevenue ?? 0,
                currency: stat?.currency ?? ev.currency,
            });
        });
        return rows;
    }
}
