/**
 * Seed tickets — simulates paid orders and materializes tickets into each
 * user's wallet so every key flow is testable right after reset.
 *
 * Requires `yarn db:seed-events` + `yarn db:seed-payout-methods` first.
 *
 * What it creates (all requiring the seeded events to exist):
 *
 *   buyer@hypepass.test
 *     → 2 tickets ISSUED for "live-now-warehouse" (test scanning)
 *     → 1 ticket ISSUED for "indie-rooftop-sunset" (test transfer + resale)
 *     → 1 ticket CHECKED_IN for "ended-club-session" (wallet "past" tab)
 *
 *   laura@hypepass.test
 *     → 1 ticket LISTED on marketplace for "stand-up-bogota-live"
 *       (buyer@hypepass.test can test secondary purchase against this)
 *
 *   pedro@hypepass.test
 *     → 1 courtesy ticket (courtesy=true, faceValue=0) for "indie-rooftop-sunset"
 *       (test resale block + transfer allowed)
 *
 * Idempotent via a paymentReference check per order.
 *
 * Usage:
 *   yarn db:seed-tickets
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrderEntity } from '../src/tickets/domain/entities/order.entity';
import { OrderItemEntity } from '../src/tickets/domain/entities/order-item.entity';
import { TicketEntity } from '../src/tickets/domain/entities/ticket.entity';
import { CheckinEntity } from '../src/tickets/domain/entities/checkin.entity';
import { OrderStatus, OrderType } from '../src/tickets/domain/types/order-status';
import { TicketStatus } from '../src/tickets/domain/types/ticket-status';
import {
    CheckinRejectionReason,
    CheckinResult,
} from '../src/tickets/domain/types/checkin-rejection-reason';
import { ResaleListingEntity } from '../src/marketplace/domain/entities/resale-listing.entity';
import { ResaleListingStatus } from '../src/marketplace/domain/types/resale-listing-status';
import {
    checkin_service_token,
    order_item_service_token,
    order_service_token,
    ticket_service_token,
} from '../src/tickets/infrastructure/tokens/tickets.tokens';
import {
    event_service_token,
    event_session_service_token,
    ticket_sale_phase_service_token,
    ticket_section_service_token,
} from '../src/events/infrastructure/tokens/events.tokens';
import { resale_listing_service_token } from '../src/marketplace/infrastructure/tokens/marketplace.tokens';
import { user_service_token } from '../src/users/infrastructure/tokens/users.tokens';
import type { IEventRepository } from '../src/events/domain/repositories/event.repository';
import type { IEventSessionRepository } from '../src/events/domain/repositories/event-session.repository';
import type { ITicketSectionRepository } from '../src/events/domain/repositories/ticket-section.repository';
import type { ITicketSalePhaseRepository } from '../src/events/domain/repositories/ticket-sale-phase.repository';
import type { IOrderRepository } from '../src/tickets/domain/repositories/order.repository';
import type { IOrderItemRepository } from '../src/tickets/domain/repositories/order-item.repository';
import type { ITicketRepository } from '../src/tickets/domain/repositories/ticket.repository';
import type { ICheckinRepository } from '../src/tickets/domain/repositories/checkin.repository';
import type { IResaleListingRepository } from '../src/marketplace/domain/repositories/resale-listing.repository';
import type { IUserRepository } from '../src/users/domain/repositories/user.repository';

type TicketSpec = {
    buyerEmail: string;
    eventSlug: string;
    /** 0-indexed within the event's sessions array from seed-events. */
    sessionIndex?: number;
    sectionName: string;
    phaseName: string;
    quantity: number;
    /** Post-issuance status for the tickets. Default: ISSUED. */
    ticketStatus?: TicketStatus;
    /** Optional: mark as courtesy (faceValue will be forced to 0). */
    courtesy?: boolean;
    /** Optional: also create a resale listing for the first ticket issued. */
    listOnMarketplace?: {
        askPrice: number;
        note?: string;
    };
    /** Optional: record an ACCEPTED checkin for each ticket (for past events). */
    markCheckedIn?: {
        scannedAtOffsetHours: number;
    };
    /** Human-readable reason used in order.buyerFullName for logs. */
    reason: string;
};

const TICKETS: TicketSpec[] = [
    // buyer@ × 2 tickets for the live-now event
    {
        buyerEmail: 'buyer@hypepass.test',
        eventSlug: 'live-now-warehouse',
        sectionName: 'General',
        phaseName: 'Última fase',
        quantity: 2,
        reason: 'buyer tickets for the live-now event (test QR + check-in)',
    },
    // buyer@ × 1 ticket for the upcoming event (transfer + resale playground)
    {
        buyerEmail: 'buyer@hypepass.test',
        eventSlug: 'indie-rooftop-sunset',
        sectionName: 'General',
        phaseName: 'Fase única',
        quantity: 1,
        reason: 'buyer ticket for an upcoming event (test transfer + resale)',
    },
    // buyer@ × 1 ticket for the ended event (already checked in)
    {
        buyerEmail: 'buyer@hypepass.test',
        eventSlug: 'ended-club-session',
        sectionName: 'General',
        phaseName: 'Fase única',
        quantity: 1,
        ticketStatus: TicketStatus.CHECKED_IN,
        markCheckedIn: {
            scannedAtOffsetHours: -7 * 24 + 1, // ~1h after the session started
        },
        reason: 'buyer ticket that already happened (wallet past tab)',
    },
    // laura@ × 1 ticket LISTED for resale (buyer can buy it secondary)
    {
        buyerEmail: 'laura@hypepass.test',
        eventSlug: 'stand-up-bogota-live',
        sectionName: 'Platea',
        phaseName: 'Fase única',
        quantity: 1,
        ticketStatus: TicketStatus.LISTED,
        listOnMarketplace: {
            askPrice: 75_000_00, // slightly above face-value
            note: 'No puedo asistir, lo vendo al valor nominal + comisión.',
        },
        reason: 'laura ticket listed on marketplace',
    },
    // pedro@ × 1 courtesy (faceValue=0, courtesy=true)
    {
        buyerEmail: 'pedro@hypepass.test',
        eventSlug: 'indie-rooftop-sunset',
        sectionName: 'General',
        phaseName: 'Fase única',
        quantity: 1,
        courtesy: true,
        reason: 'pedro courtesy ticket (test resale block, transfer allowed)',
    },
];

const PLATFORM_FEE_PCT = 10; // default marketplace commission in env

function referenceFor(spec: TicketSpec): string {
    return `SEED-${spec.buyerEmail.split('@')[0]}-${spec.eventSlug}-${spec.sectionName}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-');
}

function computeResalePricing(askPrice: number, feePct: number) {
    const platformFeeAmount = Math.round((askPrice * feePct) / 100);
    return {
        askPrice,
        platformFeeAmount,
        sellerNetAmount: askPrice - platformFeeAmount,
    };
}

async function main() {
    process.env.SWEEPER_ENABLED = 'false';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    const userRepo = app.get<IUserRepository>(user_service_token);
    const eventRepo = app.get<IEventRepository>(event_service_token);
    const sessionRepo = app.get<IEventSessionRepository>(
        event_session_service_token,
    );
    const sectionRepo = app.get<ITicketSectionRepository>(
        ticket_section_service_token,
    );
    const phaseRepo = app.get<ITicketSalePhaseRepository>(
        ticket_sale_phase_service_token,
    );
    const orderRepo = app.get<IOrderRepository>(order_service_token);
    const orderItemRepo = app.get<IOrderItemRepository>(order_item_service_token);
    const ticketRepo = app.get<ITicketRepository>(ticket_service_token);
    const checkinRepo = app.get<ICheckinRepository>(checkin_service_token);
    const listingRepo = app.get<IResaleListingRepository>(
        resale_listing_service_token,
    );

    console.log('→ Seeding tickets…');

    for (const spec of TICKETS) {
        const reference = referenceFor(spec);
        const existing = await orderRepo.findByPaymentReference(reference);
        if (existing) {
            console.log(`  · order ${reference} already exists, skipping`);
            continue;
        }

        const user = await userRepo.findByEmail(spec.buyerEmail);
        if (!user) {
            console.warn(`  ! user ${spec.buyerEmail} not found, skipping`);
            continue;
        }
        const event = await eventRepo.findBySlug(spec.eventSlug);
        if (!event) {
            console.warn(`  ! event ${spec.eventSlug} not found, skipping`);
            continue;
        }

        const sessions = await sessionRepo.findByEvent(event.id);
        const session = sessions.sort(
            (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
        )[spec.sessionIndex ?? 0];
        if (!session) {
            console.warn(`  ! session not found for ${spec.eventSlug}`);
            continue;
        }

        const sections = await sectionRepo.findByEventSession(session.id);
        const section = sections.find((s) => s.name === spec.sectionName);
        if (!section) {
            console.warn(
                `  ! section "${spec.sectionName}" not found for ${spec.eventSlug}`,
            );
            continue;
        }

        const phases = await phaseRepo.findBySection(section.id);
        const phase = phases.find((p) => p.name === spec.phaseName);
        if (!phase) {
            console.warn(
                `  ! phase "${spec.phaseName}" not found for ${spec.eventSlug}/${spec.sectionName}`,
            );
            continue;
        }

        const unitPrice = spec.courtesy ? 0 : phase.price;
        const serviceFee = spec.courtesy ? 0 : (phase.serviceFee ?? 0);
        const lineTotal = (unitPrice + serviceFee) * spec.quantity;
        const orderType = spec.courtesy ? OrderType.COURTESY : OrderType.PRIMARY;

        const order = await orderRepo.create(
            new OrderEntity({
                userId: user.id,
                companyId: event.companyId,
                type: orderType,
                status: OrderStatus.PAID,
                currency: event.currency,
                subtotal: unitPrice * spec.quantity,
                serviceFeeTotal: serviceFee * spec.quantity,
                platformFeeTotal: 0,
                taxTotal: 0,
                grandTotal: lineTotal,
                paymentProvider: spec.courtesy ? 'courtesy' : 'wompi',
                paymentReference: reference,
                reservedUntil: null,
                buyerFullName: user.name,
                buyerEmail: user.email,
                buyerPhone: null,
                buyerLegalId: null,
                buyerLegalIdType: null,
                needsReconciliation: false,
                reconciliationReason: null,
            }),
        );

        const orderItem = await orderItemRepo.create(
            new OrderItemEntity({
                orderId: order.id,
                eventId: event.id,
                eventSessionId: session.id,
                ticketSectionId: section.id,
                ticketSalePhaseId: spec.courtesy ? null : phase.id,
                quantity: spec.quantity,
                unitPrice,
                serviceFee,
                platformFee: 0,
                taxAmount: 0,
                lineTotal,
            }),
        );

        const ticketStatus = spec.ticketStatus ?? TicketStatus.ISSUED;
        const issued: TicketEntity[] = [];
        for (let i = 0; i < spec.quantity; i++) {
            const ticket = await ticketRepo.create(
                new TicketEntity({
                    orderItemId: orderItem.id,
                    originalOrderId: order.id,
                    currentOwnerUserId: user.id,
                    eventId: event.id,
                    eventSessionId: session.id,
                    ticketSectionId: section.id,
                    ticketSalePhaseId: spec.courtesy ? null : phase.id,
                    status: ticketStatus,
                    ownershipVersion: 1,
                    faceValue: unitPrice,
                    latestSalePrice: null,
                    currency: event.currency,
                    qrGenerationVersion: 1,
                    courtesy: !!spec.courtesy,
                }),
            );
            issued.push(ticket);
        }

        console.log(
            `  ✓ ${spec.buyerEmail} × ${spec.quantity} ${ticketStatus}${spec.courtesy ? ' (courtesy)' : ''} — ${spec.eventSlug}`,
        );

        // Optional: record an accepted checkin for each ticket
        if (spec.markCheckedIn) {
            const scannedAt = new Date(
                Date.now() + spec.markCheckedIn.scannedAtOffsetHours * 3_600_000,
            );
            for (const t of issued) {
                await checkinRepo.create(
                    new CheckinEntity({
                        ticketId: t.id,
                        eventSessionId: session.id,
                        scannedByUserId: null, // system-seeded, no staff attributed
                        scannerDeviceId: 'seed',
                        result: CheckinResult.ACCEPTED,
                        rejectionReason: null as unknown as CheckinRejectionReason,
                        scannedAt,
                    }),
                );
            }
            console.log(
                `    ↳ recorded ACCEPTED checkins (${spec.quantity}) @ ${scannedAt.toISOString()}`,
            );
        }

        // Optional: create a resale listing for the first ticket
        if (spec.listOnMarketplace && issued[0]) {
            const pricing = computeResalePricing(
                spec.listOnMarketplace.askPrice,
                PLATFORM_FEE_PCT,
            );
            await listingRepo.create(
                new ResaleListingEntity({
                    ticketId: issued[0].id,
                    sellerUserId: user.id,
                    askPrice: pricing.askPrice,
                    platformFeeAmount: pricing.platformFeeAmount,
                    sellerNetAmount: pricing.sellerNetAmount,
                    currency: event.currency,
                    status: ResaleListingStatus.ACTIVE,
                    note: spec.listOnMarketplace.note ?? null,
                    reservedByUserId: null,
                    reservedUntil: null,
                    expiresAt: new Date(
                        session.startsAt.getTime() - 12 * 3_600_000,
                    ),
                    cancelledAt: null,
                    soldAt: null,
                }),
            );
            console.log(
                `    ↳ listed on marketplace @ ${pricing.askPrice / 100} COP (fee ${pricing.platformFeeAmount / 100})`,
            );
        }
    }

    console.log('\n✓ Tickets seed complete.');

    await app.close();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
