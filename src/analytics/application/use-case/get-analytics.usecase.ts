import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type AnalyticsResult = {
    range: { from: string; to: string };
    totals: {
        pageViews: number;
        uniqueSessions: number;
        uniqueUsers: number;
    };
    series: Array<{ day: string; views: number; sessions: number }>;
    topPaths: Array<{ path: string; views: number; sessions: number }>;
    topReferrers: Array<{ referrer: string; views: number }>;
    devices: Array<{ device: string; views: number }>;
};

@Injectable()
export class GetAnalyticsUseCase {
    constructor(private readonly ds: DataSource) {}

    async execute(daysBack = 30): Promise<AnalyticsResult> {
        const days = Math.max(1, Math.min(90, daysBack));
        const to = new Date();
        const from = new Date(to.getTime() - days * 86400 * 1000);

        const [totals, series, topPaths, topReferrers, devices] = await Promise.all([
            this.ds.query<
                Array<{
                    page_views: string;
                    unique_sessions: string;
                    unique_users: string;
                }>
            >(
                `SELECT
                    COUNT(*)::text AS page_views,
                    COUNT(DISTINCT session_id)::text AS unique_sessions,
                    COUNT(DISTINCT user_id)::text AS unique_users
                 FROM page_views
                 WHERE created_at >= $1`,
                [from],
            ),
            this.ds.query<Array<{ day: string; views: string; sessions: string }>>(
                `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
                        COALESCE(COUNT(pv.id), 0)::text AS views,
                        COUNT(DISTINCT pv.session_id)::text AS sessions
                 FROM generate_series($1::date, $2::date, '1 day') d
                 LEFT JOIN page_views pv
                   ON pv.created_at::date = d::date
                 GROUP BY d
                 ORDER BY d ASC`,
                [from, to],
            ),
            this.ds.query<Array<{ path: string; views: string; sessions: string }>>(
                `SELECT path,
                        COUNT(*)::text AS views,
                        COUNT(DISTINCT session_id)::text AS sessions
                 FROM page_views
                 WHERE created_at >= $1
                 GROUP BY path
                 ORDER BY COUNT(*) DESC
                 LIMIT 20`,
                [from],
            ),
            this.ds.query<Array<{ referrer: string | null; views: string }>>(
                `SELECT referrer, COUNT(*)::text AS views
                 FROM page_views
                 WHERE created_at >= $1
                 GROUP BY referrer
                 ORDER BY COUNT(*) DESC
                 LIMIT 10`,
                [from],
            ),
            this.ds.query<Array<{ device: string | null; views: string }>>(
                `SELECT device, COUNT(*)::text AS views
                 FROM page_views
                 WHERE created_at >= $1
                 GROUP BY device
                 ORDER BY COUNT(*) DESC
                 LIMIT 5`,
                [from],
            ),
        ]);

        const t = totals[0] ?? { page_views: '0', unique_sessions: '0', unique_users: '0' };
        return {
            range: { from: from.toISOString(), to: to.toISOString() },
            totals: {
                pageViews: Number(t.page_views),
                uniqueSessions: Number(t.unique_sessions),
                uniqueUsers: Number(t.unique_users),
            },
            series: series.map((r) => ({
                day: r.day,
                views: Number(r.views),
                sessions: Number(r.sessions),
            })),
            topPaths: topPaths.map((r) => ({
                path: r.path,
                views: Number(r.views),
                sessions: Number(r.sessions),
            })),
            topReferrers: topReferrers
                .filter((r) => r.referrer)
                .map((r) => ({
                    referrer: r.referrer as string,
                    views: Number(r.views),
                })),
            devices: devices
                .filter((r) => r.device)
                .map((r) => ({ device: r.device as string, views: Number(r.views) })),
        };
    }
}
