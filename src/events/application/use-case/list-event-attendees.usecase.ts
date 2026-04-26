import { DataSource } from 'typeorm';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export type AttendeeRow = {
    ticketId: string;
    issuedAt: string;
    sessionId: string;
    sessionName: string | null;
    sessionStartsAt: string;
    sectionId: string;
    sectionName: string;
    type: 'paid' | 'courtesy';
    status: string;
    paymentReference: string | null;
    /** Buyer of the original order (whoever paid / received the courtesy). */
    buyerFullName: string | null;
    buyerEmail: string | null;
    /** Current owner — may differ from buyer if the ticket was transferred. */
    ownerEmail: string | null;
    ownerName: string | null;
    transferred: boolean;
    promoterReferralCode: string | null;
    faceValue: number;
    currency: string;
};

export type AttendeesFilter = {
    sessionId?: string;
    sectionId?: string;
    /** 'all' | 'paid' | 'courtesy' */
    type?: 'paid' | 'courtesy';
    /** Free-text search against buyer/owner email or name. */
    q?: string;
    limit?: number;
    offset?: number;
};

export type AttendeesResult = {
    items: AttendeeRow[];
    total: number;
    limit: number;
    offset: number;
};

/**
 * Returns one row per issued ticket for the event so the organizer can see
 * exactly who's attending — paid buyers and courtesy recipients alike.
 */
export class ListEventAttendeesUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly ds: DataSource,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        filter: AttendeesFilter,
    ): Promise<AttendeesResult> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );

        const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
        const offset = Math.max(filter.offset ?? 0, 0);

        const params: unknown[] = [event.id];
        const where: string[] = ['t.event_id = $1'];
        const push = (sql: string, value: unknown) => {
            params.push(value);
            where.push(sql.replace('?', `$${params.length}`));
        };
        if (filter.sessionId) push('t.event_session_id = ?', filter.sessionId);
        if (filter.sectionId) push('t.ticket_section_id = ?', filter.sectionId);
        if (filter.type === 'paid') where.push('t.courtesy = false');
        if (filter.type === 'courtesy') where.push('t.courtesy = true');
        if (filter.q) {
            const needle = `%${filter.q}%`;
            params.push(needle);
            const idx = params.length;
            where.push(
                `(o.buyer_email ILIKE $${idx} OR o.buyer_full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.name ILIKE $${idx})`,
            );
        }

        const whereSql = where.join(' AND ');

        const countRows = await this.ds.query<Array<{ n: string }>>(
            `SELECT COUNT(*)::text AS n
             FROM tickets t
             LEFT JOIN orders o ON o.id = t.original_order_id
             LEFT JOIN "user" u ON u.id = t.current_owner_user_id
             WHERE ${whereSql}`,
            params,
        );
        const total = Number(countRows[0]?.n ?? 0);

        const rows = await this.ds.query<
            Array<{
                ticket_id: string;
                issued_at: Date;
                session_id: string;
                session_name: string | null;
                session_starts_at: Date;
                section_id: string;
                section_name: string;
                courtesy: boolean;
                status: string;
                payment_reference: string | null;
                buyer_full_name: string | null;
                buyer_email: string | null;
                owner_email: string | null;
                owner_name: string | null;
                buyer_user_id: string | null;
                current_owner_user_id: string;
                promoter_referral_code: string | null;
                face_value: number;
                currency: string;
            }>
        >(
            `SELECT
                t.id AS ticket_id,
                t.created_at AS issued_at,
                t.event_session_id AS session_id,
                es.name AS session_name,
                es.starts_at AS session_starts_at,
                t.ticket_section_id AS section_id,
                ts.name AS section_name,
                t.courtesy,
                t.status,
                o.payment_reference,
                o.buyer_full_name,
                o.buyer_email,
                u.email AS owner_email,
                u.name AS owner_name,
                o.user_id AS buyer_user_id,
                t.current_owner_user_id,
                o.promoter_referral_code,
                t.face_value,
                t.currency
             FROM tickets t
             LEFT JOIN orders o ON o.id = t.original_order_id
             LEFT JOIN event_sessions es ON es.id = t.event_session_id
             LEFT JOIN ticket_sections ts ON ts.id = t.ticket_section_id
             LEFT JOIN "user" u ON u.id = t.current_owner_user_id
             WHERE ${whereSql}
             ORDER BY t.created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            params,
        );

        const items: AttendeeRow[] = rows.map((r) => ({
            ticketId: r.ticket_id,
            issuedAt: r.issued_at.toISOString(),
            sessionId: r.session_id,
            sessionName: r.session_name,
            sessionStartsAt: r.session_starts_at.toISOString(),
            sectionId: r.section_id,
            sectionName: r.section_name,
            type: r.courtesy ? 'courtesy' : 'paid',
            status: r.status,
            paymentReference: r.payment_reference,
            buyerFullName: r.buyer_full_name,
            buyerEmail: r.buyer_email,
            ownerEmail: r.owner_email,
            ownerName: r.owner_name,
            transferred: !!(
                r.buyer_user_id &&
                r.current_owner_user_id &&
                r.buyer_user_id !== r.current_owner_user_id
            ),
            promoterReferralCode: r.promoter_referral_code,
            faceValue: r.face_value,
            currency: r.currency,
        }));

        return { items, total, limit, offset };
    }
}
