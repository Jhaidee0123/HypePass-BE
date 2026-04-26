import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { DataSource } from 'typeorm';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventPromoterService } from '../services/event-promoter.service';

export type PromoterSaleOrderRow = {
    orderId: string;
    paymentReference: string;
    createdAt: string;
    status: string;
    buyerEmailMasked: string;
    quantity: number;
    grossTotal: number;
    currency: string;
};

export type PromoterSalesResult = {
    event: {
        id: string;
        title: string;
        slug: string;
        coverImageUrl: string | null;
    };
    referralCode: string;
    referralLink: string;
    revokedAt: string | null;
    summary: {
        ticketsSold: number;
        ordersCount: number;
        grossRevenue: number;
        currency: string;
    };
    orders: PromoterSaleOrderRow[];
};

const maskEmail = (email: string | null | undefined): string => {
    if (!email) return '—';
    const [local, domain] = email.split('@');
    if (!domain) return '—';
    if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
    return `${local[0]}${local[1]}***@${domain}`;
};

/**
 * Promoter detail view of one event: stats + list of orders attributed to
 * their code. Buyer email is masked for privacy (the promoter doesn't get
 * full PII; just enough to recognize their own contacts).
 */
export class GetPromoterSalesUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly promoterService: EventPromoterService,
        private readonly ds: DataSource,
    ) {}

    async execute(
        userId: string,
        eventId: string,
    ): Promise<PromoterSalesResult> {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new NotFoundDomainException('Event not found');

        const active = await this.promoterService.findActiveByEventAndUser(
            event.id,
            userId,
        );
        let promoter = active;
        if (!promoter) {
            const historical =
                await this.promoterService.findHistoricalByUser(userId);
            promoter = historical.find((p) => p.eventId === event.id) ?? null;
        }
        if (!promoter) {
            throw new ForbiddenDomainException(
                'You are not a promoter of this event',
            );
        }

        const orders = await this.ds.query<
            Array<{
                id: string;
                payment_reference: string;
                created_at: Date;
                status: string;
                buyer_email: string | null;
                grand_total: number;
                currency: string;
                quantity: string;
            }>
        >(
            `SELECT
                o.id, o.payment_reference, o.created_at, o.status,
                o.buyer_email, o.grand_total, o.currency,
                COALESCE(SUM(oi.quantity), 0)::text AS quantity
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.promoter_referral_code = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT 200`,
            [promoter.referralCode],
        );

        const ordersOut: PromoterSaleOrderRow[] = orders.map((r) => ({
            orderId: r.id,
            paymentReference: r.payment_reference,
            createdAt: r.created_at.toISOString(),
            status: r.status,
            buyerEmailMasked: maskEmail(r.buyer_email),
            quantity: Number(r.quantity),
            grossTotal: Number(r.grand_total),
            currency: r.currency,
        }));

        const paid = orders.filter((r) => r.status === 'paid');
        const ticketsSold = paid.reduce((acc, r) => acc + Number(r.quantity), 0);
        const grossRevenue = paid.reduce(
            (acc, r) => acc + Number(r.grand_total),
            0,
        );

        const appUrl = process.env.APP_URL ?? '';
        return {
            event: {
                id: event.id,
                title: event.title,
                slug: event.slug,
                coverImageUrl: event.coverImageUrl ?? null,
            },
            referralCode: promoter.referralCode,
            referralLink: `${appUrl}/events/${event.slug}?ref=${promoter.referralCode}`,
            revokedAt: promoter.revokedAt ? promoter.revokedAt.toISOString() : null,
            summary: {
                ticketsSold,
                ordersCount: paid.length,
                grossRevenue,
                currency: event.currency,
            },
            orders: ordersOut,
        };
    }
}
