import { DataSource } from 'typeorm';
import {
    ConflictDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { PaymentGatewayPort } from '../../../payments/domain/ports/payment-gateway.port';
import { PaymentEntity } from '../../../payments/domain/entities/payment.entity';
import { IPaymentRepository } from '../../../payments/domain/repositories/payment.repository';
import { PaymentStatus } from '../../../payments/domain/types/payment-status';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../events/domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../../events/domain/repositories/ticket-sale-phase.repository';
import { EventStatus } from '../../../events/domain/types/event-status';
import { TicketSectionOrmEntity } from '../../../events/infrastructure/orm/ticket-section.orm.entity';
import { InventoryHoldOrmEntity } from '../../../tickets/infrastructure/orm/inventory-hold.orm.entity';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { InventoryHoldStatus } from '../../../tickets/domain/types/inventory-hold-status';
import { InventoryHoldEntity } from '../../../tickets/domain/entities/inventory-hold.entity';
import { OrderEntity } from '../../../tickets/domain/entities/order.entity';
import { OrderItemEntity } from '../../../tickets/domain/entities/order-item.entity';
import { IInventoryHoldRepository } from '../../../tickets/domain/repositories/inventory-hold.repository';
import { IOrderRepository } from '../../../tickets/domain/repositories/order.repository';
import { IOrderItemRepository } from '../../../tickets/domain/repositories/order-item.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import {
    OrderStatus,
    OrderType,
} from '../../../tickets/domain/types/order-status';
import { OWNABLE_TICKET_STATUSES } from '../../../tickets/domain/types/ticket-status';
import { InitiateCheckoutDto } from '../dto/initiate-checkout.dto';
import { InitiateCheckoutResponse } from '../types/initiate-checkout-response';
import { computePricing, makePaymentReference } from './helpers/pricing';
import { EventPromoterService } from '../../../events/application/services/event-promoter.service';

export type InitiateCheckoutInput = {
    userId: string;
    buyerEmail: string;
    buyerFullName: string;
    buyerPhone: string;
    buyerLegalId: string;
    buyerLegalIdType: string;
    referralCode?: string;
    selection: Pick<
        InitiateCheckoutDto,
        | 'eventId'
        | 'eventSessionId'
        | 'ticketSectionId'
        | 'ticketSalePhaseId'
        | 'quantity'
    >;
};

/**
 * Core primary-sale checkout initiator. Validates server-side, reserves
 * inventory inside a transaction with pessimistic lock on the section, and
 * persists order + item + hold + payment. Does NOT issue tickets — that
 * happens after Wompi confirms in `verify-payment` / webhook.
 */
export class InitiateCheckoutUseCase {
    constructor(
        private readonly dataSource: DataSource,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
        private readonly orderRepo: IOrderRepository,
        private readonly orderItemRepo: IOrderItemRepository,
        private readonly inventoryHoldRepo: IInventoryHoldRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly paymentRepo: IPaymentRepository,
        private readonly gateway: PaymentGatewayPort,
        private readonly config: {
            platformFeePct: number;
            holdMinutes: number;
        },
        private readonly promoterService: EventPromoterService,
    ) {}

    async execute(
        input: InitiateCheckoutInput,
    ): Promise<InitiateCheckoutResponse> {
        const { userId, selection } = input;

        const event = await this.eventRepo.findById(selection.eventId);
        if (!event) throw new NotFoundDomainException('Event not found');
        if (event.status !== EventStatus.PUBLISHED) {
            throw new UnprocessableDomainException(
                `Event is not on sale (status: ${event.status})`,
                'EVENT_NOT_PUBLISHED',
            );
        }

        const session = await this.sessionRepo.findById(selection.eventSessionId);
        if (!session) throw new NotFoundDomainException('Session not found');
        if (session.eventId !== event.id) {
            throw new UnprocessableDomainException(
                'Session does not belong to event',
            );
        }

        const section = await this.sectionRepo.findById(
            selection.ticketSectionId,
        );
        if (!section) throw new NotFoundDomainException('Section not found');
        if (section.eventSessionId !== session.id) {
            throw new UnprocessableDomainException(
                'Section does not belong to session',
            );
        }

        const phase = await this.phaseRepo.findById(selection.ticketSalePhaseId);
        if (!phase) throw new NotFoundDomainException('Sale phase not found');
        if (phase.ticketSectionId !== section.id) {
            throw new UnprocessableDomainException(
                'Phase does not belong to section',
            );
        }
        const now = new Date();
        if (!phase.isOpenAt(now)) {
            throw new UnprocessableDomainException(
                'Sale phase is not active right now',
                'PHASE_NOT_ACTIVE',
            );
        }

        if (selection.quantity < section.minPerOrder) {
            throw new UnprocessableDomainException(
                `Minimum ${section.minPerOrder} per order`,
                'BELOW_MIN',
            );
        }
        if (selection.quantity > section.maxPerOrder) {
            throw new UnprocessableDomainException(
                `Maximum ${section.maxPerOrder} per order`,
                'ABOVE_MAX',
            );
        }

        // Per-user, per-session cap (optional, event-level)
        if (
            event.maxTicketsPerUserPerSession != null &&
            event.maxTicketsPerUserPerSession > 0
        ) {
            const existing = await this.countUserSessionOwnership(
                userId,
                session.id,
            );
            if (existing + selection.quantity >
                event.maxTicketsPerUserPerSession
            ) {
                throw new UnprocessableDomainException(
                    `You already have ${existing} ticket(s)/hold(s) for this session — max ${event.maxTicketsPerUserPerSession} per user.`,
                    'PER_USER_SESSION_CAP',
                );
            }
        }

        const pricing = computePricing(
            phase,
            selection.quantity,
            this.config.platformFeePct,
        );

        const reference = makePaymentReference();
        const reservedUntil = new Date(
            now.getTime() + this.config.holdMinutes * 60_000,
        );

        // Reserve inventory atomically: lock the section row, count issued
        // + active holds, and fail if overselling would result.
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        let createdOrderId: string;
        let createdPaymentId: string;
        try {
            const lockedSection = await qr.manager.findOne(
                TicketSectionOrmEntity,
                {
                    where: { id: section.id },
                    lock: { mode: 'pessimistic_write' },
                },
            );
            if (!lockedSection) {
                throw new NotFoundDomainException('Section not found');
            }

            const activeHolds =
                await this.inventoryHoldRepo.sumActiveForSection(
                    section.id,
                    now,
                );
            const issuedTickets =
                await this.ticketRepo.countBySectionAndStatus(
                    section.id,
                    OWNABLE_TICKET_STATUSES,
                );
            const reserved = activeHolds + issuedTickets;
            if (reserved + selection.quantity > lockedSection.totalInventory) {
                throw new ConflictDomainException(
                    'Not enough inventory',
                    'OVERSOLD',
                );
            }

            // Validate optional promoter referral code: lookup active promoter
            // for this event with the given code. Invalid codes are silently
            // ignored so a typo never blocks the buyer's checkout.
            let promoterReferralCode: string | null = null;
            if (input.referralCode && input.referralCode.trim().length > 0) {
                const code = input.referralCode.trim().toUpperCase();
                const promoter =
                    await this.promoterService.findActiveByEventAndCode(
                        event.id,
                        code,
                    );
                if (promoter) promoterReferralCode = promoter.referralCode;
            }

            const order = new OrderEntity({
                userId,
                companyId: event.companyId,
                type: OrderType.PRIMARY,
                status: OrderStatus.AWAITING_PAYMENT,
                currency: pricing.currency,
                subtotal: pricing.subtotal,
                serviceFeeTotal: pricing.serviceFeeTotal,
                platformFeeTotal: pricing.platformFeeTotal,
                taxTotal: pricing.taxTotal,
                grandTotal: pricing.grandTotal,
                paymentProvider: 'wompi',
                paymentReference: reference,
                reservedUntil,
                buyerFullName: input.buyerFullName,
                buyerEmail: input.buyerEmail,
                buyerPhone: input.buyerPhone,
                buyerLegalId: input.buyerLegalId,
                buyerLegalIdType: input.buyerLegalIdType,
                promoterReferralCode,
            });
            const savedOrder = await this.orderRepo.create(order);
            createdOrderId = savedOrder.id;

            const item = new OrderItemEntity({
                orderId: savedOrder.id,
                eventId: event.id,
                eventSessionId: session.id,
                ticketSectionId: section.id,
                ticketSalePhaseId: phase.id,
                quantity: selection.quantity,
                unitPrice: pricing.unitPrice,
                serviceFee: pricing.serviceFeePerUnit,
                platformFee: pricing.platformFeePerUnit,
                taxAmount: pricing.taxPerUnit,
                lineTotal: pricing.grandTotal,
            });
            await this.orderItemRepo.create(item);

            const hold = new InventoryHoldEntity({
                userId,
                eventSessionId: session.id,
                ticketSectionId: section.id,
                ticketSalePhaseId: phase.id,
                quantity: selection.quantity,
                status: InventoryHoldStatus.ACTIVE,
                expiresAt: reservedUntil,
                orderId: savedOrder.id,
            });
            await this.inventoryHoldRepo.create(hold);

            const payment = new PaymentEntity({
                orderId: savedOrder.id,
                userId,
                amount: pricing.grandTotal,
                currency: pricing.currency,
                status: PaymentStatus.PENDING,
                provider: 'wompi',
                providerReference: reference,
            });
            const savedPayment = await this.paymentRepo.create(payment);
            createdPaymentId = savedPayment.id;

            await qr.commitTransaction();
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }

        // Compute signature once all data is persisted
        const signature = await this.gateway.generateSignature(
            reference,
            pricing.grandTotal,
            pricing.currency,
        );
        const publicKey = await this.gateway.getPublicKey();

        return {
            orderId: createdOrderId,
            paymentId: createdPaymentId,
            reference,
            amountInCents: pricing.grandTotal,
            currency: pricing.currency,
            signature,
            publicKey,
            customerEmail: input.buyerEmail,
            customerFullName: input.buyerFullName,
            customerPhone: input.buyerPhone,
            customerLegalId: input.buyerLegalId,
            customerLegalIdType: input.buyerLegalIdType,
            reservedUntil: reservedUntil.toISOString(),
        };
    }

    private async countUserSessionOwnership(
        userId: string,
        eventSessionId: string,
    ): Promise<number> {
        const now = new Date();
        // Count only tickets that "occupy a seat" from the user's perspective:
        // ownable statuses + CHECKED_IN (can't buy more to attend twice).
        const tickets = await this.dataSource.manager
            .createQueryBuilder(TicketOrmEntity, 't')
            .where('t.current_owner_user_id = :uid', { uid: userId })
            .andWhere('t.event_session_id = :sid', { sid: eventSessionId })
            .andWhere('t.status IN (:...statuses)', {
                statuses: [
                    ...OWNABLE_TICKET_STATUSES,
                    'checked_in',
                ],
            })
            .getCount();
        const holdsSumRaw = await this.dataSource.manager
            .createQueryBuilder(InventoryHoldOrmEntity, 'h')
            .select('COALESCE(SUM(h.quantity), 0)', 'sum')
            .where('h.user_id = :uid', { uid: userId })
            .andWhere('h.event_session_id = :sid', { sid: eventSessionId })
            .andWhere('h.status = :status', {
                status: InventoryHoldStatus.ACTIVE,
            })
            .andWhere('h.expires_at > :now', { now })
            .getRawOne<{ sum: string }>();
        const holds = parseInt(holdsSumRaw?.sum ?? '0', 10) || 0;
        return tickets + holds;
    }
}
