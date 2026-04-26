import { DataSource } from 'typeorm';

export type DashboardKpis = {
    revenue: {
        total: number;
        platformFees: number;
        last30d: number;
        today: number;
        ordersCount: number;
    };
    tickets: {
        totalIssued: number;
        checkedIn: number;
        courtesies: number;
        listed: number;
    };
    events: {
        published: number;
        pendingReview: number;
        draft: number;
        approved: number;
        cancelledOrEnded: number;
    };
    companies: {
        active: number;
        pending: number;
        rejected: number;
    };
    users: {
        total: number;
        newToday: number;
        last30d: number;
        platformAdmins: number;
    };
    marketplace: {
        activeListings: number;
        soldCount: number;
        gmv: number;
    };
    payouts: {
        pendingEvent: { count: number; amount: number };
        payable: { count: number; amount: number };
        paid: { count: number; amount: number };
        failed: { count: number; amount: number };
    };
};

export type DashboardSeries = {
    revenueByDay: Array<{ day: string; revenue: number; orders: number }>;
    ticketsByDay: Array<{ day: string; count: number }>;
    signupsByDay: Array<{ day: string; count: number }>;
};

export type DashboardTop = {
    topEventsByRevenue: Array<{
        eventId: string;
        slug: string;
        title: string;
        revenue: number;
        ticketsSold: number;
    }>;
    topOrganizersByGmv: Array<{
        companyId: string;
        slug: string;
        name: string;
        gmv: number;
        eventsCount: number;
    }>;
};

export type DashboardHealth = {
    db: { status: 'ok' | 'error'; latencyMs: number };
    uptimeSec: number;
    needsReconciliation: number;
};

export type DashboardResponse = {
    kpis: DashboardKpis;
    series: DashboardSeries;
    top: DashboardTop;
    health: DashboardHealth;
    generatedAt: string;
};

const num = (raw: string | number | null | undefined): number =>
    Number(raw) || 0;

/**
 * Aggregates platform-wide KPIs in a single call. Uses raw SQL via DataSource
 * because a dashboard needs many small aggregations and going through every
 * repo would be N×M round-trips. All queries hit indexed columns
 * (status, created_at, courtesy, etc.).
 */
export class GetAdminDashboardUseCase {
    constructor(private readonly dataSource: DataSource) {}

    async execute(): Promise<DashboardResponse> {
        const [
            revenueAgg,
            revenue30dAgg,
            revenueTodayAgg,
            ticketStats,
            eventCounts,
            companyCounts,
            userCounts,
            usersTodayCount,
            users30dCount,
            platformAdminCount,
            marketplaceStats,
            payoutBreakdown,
            revenueByDay,
            ticketsByDay,
            signupsByDay,
            topEvents,
            topOrganizers,
            dbHealth,
            reconcileCount,
        ] = await Promise.all([
            this._sumRevenue(),
            this._sumRevenue("AND created_at >= NOW() - INTERVAL '30 days'"),
            this._sumRevenue('AND created_at >= CURRENT_DATE'),
            this._ticketStats(),
            this._eventCounts(),
            this._companyCounts(),
            this._countUsers(),
            this._countUsers(`WHERE "createdAt" >= CURRENT_DATE`),
            this._countUsers(
                `WHERE "createdAt" >= NOW() - INTERVAL '30 days'`,
            ),
            this._countUsers(`WHERE role = 'platform_admin'`),
            this._marketplaceStats(),
            this._payoutBreakdown(),
            this._revenueByDay(30),
            this._ticketsByDay(30),
            this._signupsByDay(30),
            this._topEventsByRevenue(10),
            this._topOrganizersByGmv(10),
            this._dbHealth(),
            this._reconcileCount(),
        ]);

        return {
            kpis: {
                revenue: {
                    total: revenueAgg.total,
                    platformFees: revenueAgg.platformFees,
                    last30d: revenue30dAgg.total,
                    today: revenueTodayAgg.total,
                    ordersCount: revenueAgg.ordersCount,
                },
                tickets: ticketStats,
                events: eventCounts,
                companies: companyCounts,
                users: {
                    total: userCounts,
                    newToday: usersTodayCount,
                    last30d: users30dCount,
                    platformAdmins: platformAdminCount,
                },
                marketplace: marketplaceStats,
                payouts: payoutBreakdown,
            },
            series: { revenueByDay, ticketsByDay, signupsByDay },
            top: { topEventsByRevenue: topEvents, topOrganizersByGmv: topOrganizers },
            health: {
                db: dbHealth,
                uptimeSec: Math.round(process.uptime()),
                needsReconciliation: reconcileCount,
            },
            generatedAt: new Date().toISOString(),
        };
    }

    private async _sumRevenue(extraWhere = ''): Promise<{
        total: number;
        platformFees: number;
        ordersCount: number;
    }> {
        const rows = await this.dataSource.query(
            `SELECT
                COALESCE(SUM(grand_total), 0) AS total,
                COALESCE(SUM(platform_fee_total), 0) AS platform_fees,
                COUNT(*) AS orders_count
             FROM orders
             WHERE status = 'paid' AND type IN ('primary', 'resale') ${extraWhere}`,
        );
        const r = rows[0] ?? {};
        return {
            total: num(r.total),
            platformFees: num(r.platform_fees),
            ordersCount: num(r.orders_count),
        };
    }

    private async _ticketStats() {
        const rows = await this.dataSource.query(
            `SELECT
                COUNT(*) FILTER (WHERE status IN ('issued', 'listed', 'reserved_for_resale', 'transferred', 'checked_in')) AS total_issued,
                COUNT(*) FILTER (WHERE status = 'checked_in') AS checked_in,
                COUNT(*) FILTER (WHERE courtesy = true) AS courtesies,
                COUNT(*) FILTER (WHERE status = 'listed') AS listed
             FROM tickets`,
        );
        const r = rows[0] ?? {};
        return {
            totalIssued: num(r.total_issued),
            checkedIn: num(r.checked_in),
            courtesies: num(r.courtesies),
            listed: num(r.listed),
        };
    }

    private async _eventCounts() {
        const rows = await this.dataSource.query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'published') AS published,
                COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_review,
                COUNT(*) FILTER (WHERE status = 'draft') AS draft,
                COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                COUNT(*) FILTER (WHERE status IN ('cancelled', 'ended')) AS cancelled_or_ended
             FROM events`,
        );
        const r = rows[0] ?? {};
        return {
            published: num(r.published),
            pendingReview: num(r.pending_review),
            draft: num(r.draft),
            approved: num(r.approved),
            cancelledOrEnded: num(r.cancelled_or_ended),
        };
    }

    private async _companyCounts() {
        const rows = await this.dataSource.query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'active') AS active,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
             FROM companies`,
        );
        const r = rows[0] ?? {};
        return {
            active: num(r.active),
            pending: num(r.pending),
            rejected: num(r.rejected),
        };
    }

    private async _countUsers(where = ''): Promise<number> {
        const rows = await this.dataSource.query(
            `SELECT COUNT(*) AS n FROM "user" ${where}`,
        );
        return num(rows[0]?.n);
    }

    private async _marketplaceStats() {
        const rows = await this.dataSource.query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'active') AS active_listings,
                COUNT(*) FILTER (WHERE status = 'sold') AS sold_count,
                COALESCE(SUM(ask_price) FILTER (WHERE status = 'sold'), 0) AS gmv
             FROM resale_listings`,
        );
        const r = rows[0] ?? {};
        return {
            activeListings: num(r.active_listings),
            soldCount: num(r.sold_count),
            gmv: num(r.gmv),
        };
    }

    private async _payoutBreakdown() {
        const rows = await this.dataSource.query(
            `SELECT
                status,
                COUNT(*) AS n,
                COALESCE(SUM(net_amount), 0) AS amount
             FROM payout_records
             GROUP BY status`,
        );
        const map: Record<string, { count: number; amount: number }> = {};
        for (const r of rows) {
            map[r.status] = { count: num(r.n), amount: num(r.amount) };
        }
        const empty = { count: 0, amount: 0 };
        return {
            pendingEvent: map['pending_event'] ?? empty,
            payable: map['payable'] ?? empty,
            paid: map['paid'] ?? empty,
            failed: map['failed'] ?? empty,
        };
    }

    private async _revenueByDay(days: number) {
        const rows = await this.dataSource.query(
            `WITH dates AS (
                SELECT generate_series(
                    CURRENT_DATE - ($1::int - 1),
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS day
            )
            SELECT
                d.day::text AS day,
                COALESCE(SUM(o.grand_total), 0) AS revenue,
                COUNT(o.id) AS orders
            FROM dates d
            LEFT JOIN orders o
              ON DATE(o.created_at) = d.day
             AND o.status = 'paid'
             AND o.type IN ('primary', 'resale')
            GROUP BY d.day
            ORDER BY d.day`,
            [days],
        );
        return rows.map((r: any) => ({
            day: r.day,
            revenue: num(r.revenue),
            orders: num(r.orders),
        }));
    }

    private async _ticketsByDay(days: number) {
        const rows = await this.dataSource.query(
            `WITH dates AS (
                SELECT generate_series(
                    CURRENT_DATE - ($1::int - 1),
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS day
            )
            SELECT
                d.day::text AS day,
                COUNT(t.id) AS count
            FROM dates d
            LEFT JOIN tickets t ON DATE(t.created_at) = d.day
            GROUP BY d.day
            ORDER BY d.day`,
            [days],
        );
        return rows.map((r: any) => ({ day: r.day, count: num(r.count) }));
    }

    private async _signupsByDay(days: number) {
        const rows = await this.dataSource.query(
            `WITH dates AS (
                SELECT generate_series(
                    CURRENT_DATE - ($1::int - 1),
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS day
            )
            SELECT
                d.day::text AS day,
                COUNT(u.id) AS count
            FROM dates d
            LEFT JOIN "user" u ON DATE(u."createdAt") = d.day
            GROUP BY d.day
            ORDER BY d.day`,
            [days],
        );
        return rows.map((r: any) => ({ day: r.day, count: num(r.count) }));
    }

    private async _topEventsByRevenue(limit: number) {
        const rows = await this.dataSource.query(
            `SELECT
                e.id AS event_id,
                e.slug,
                e.title,
                COALESCE(SUM(o.grand_total), 0) AS revenue,
                COUNT(t.id) FILTER (WHERE t.status IN ('issued', 'listed', 'reserved_for_resale', 'transferred', 'checked_in')) AS tickets_sold
            FROM events e
            LEFT JOIN tickets t ON t.event_id = e.id
            LEFT JOIN orders o ON o.id = t.original_order_id AND o.status = 'paid'
            GROUP BY e.id, e.slug, e.title
            HAVING COALESCE(SUM(o.grand_total), 0) > 0
            ORDER BY revenue DESC
            LIMIT $1`,
            [limit],
        );
        return rows.map((r: any) => ({
            eventId: r.event_id,
            slug: r.slug,
            title: r.title,
            revenue: num(r.revenue),
            ticketsSold: num(r.tickets_sold),
        }));
    }

    private async _topOrganizersByGmv(limit: number) {
        const rows = await this.dataSource.query(
            `SELECT
                c.id AS company_id,
                c.slug,
                c.name,
                COALESCE(SUM(o.grand_total), 0) AS gmv,
                COUNT(DISTINCT e.id) AS events_count
            FROM companies c
            LEFT JOIN events e ON e.company_id = c.id
            LEFT JOIN tickets t ON t.event_id = e.id
            LEFT JOIN orders o ON o.id = t.original_order_id AND o.status = 'paid'
            GROUP BY c.id, c.slug, c.name
            HAVING COALESCE(SUM(o.grand_total), 0) > 0
            ORDER BY gmv DESC
            LIMIT $1`,
            [limit],
        );
        return rows.map((r: any) => ({
            companyId: r.company_id,
            slug: r.slug,
            name: r.name,
            gmv: num(r.gmv),
            eventsCount: num(r.events_count),
        }));
    }

    private async _dbHealth(): Promise<{
        status: 'ok' | 'error';
        latencyMs: number;
    }> {
        const t0 = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            return { status: 'ok', latencyMs: Date.now() - t0 };
        } catch {
            return { status: 'error', latencyMs: Date.now() - t0 };
        }
    }

    private async _reconcileCount(): Promise<number> {
        const rows = await this.dataSource.query(
            `SELECT COUNT(*) AS n FROM orders WHERE needs_reconciliation = true`,
        );
        return num(rows[0]?.n);
    }
}
