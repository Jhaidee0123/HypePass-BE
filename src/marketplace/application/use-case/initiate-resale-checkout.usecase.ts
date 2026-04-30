import { DataSource } from 'typeorm';
import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { PaymentGatewayPort } from '../../../payments/domain/ports/payment-gateway.port';
import { PaymentEntity } from '../../../payments/domain/entities/payment.entity';
import { IPaymentRepository } from '../../../payments/domain/repositories/payment.repository';
import { PaymentStatus } from '../../../payments/domain/types/payment-status';
import { OrderEntity } from '../../../tickets/domain/entities/order.entity';
import { IOrderRepository } from '../../../tickets/domain/repositories/order.repository';
import {
    OrderStatus,
    OrderType,
} from '../../../tickets/domain/types/order-status';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { ResaleListingOrmEntity } from '../../infrastructure/orm/resale-listing.orm.entity';
import { ResaleOrderEntity } from '../../domain/entities/resale-order.entity';
import { IResaleOrderRepository } from '../../domain/repositories/resale-order.repository';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';
import { ResaleOrderStatus } from '../../domain/types/resale-order-status';
import { InitiateResaleCheckoutDto } from '../dto/initiate-resale-checkout.dto';
import { makeResalePaymentReference } from './helpers/resale-pricing';
import { InitiateCheckoutResponse } from '../../../checkout/application/types/initiate-checkout-response';

export type InitiateResaleCheckoutConfig = {
    reservationMinutes: number;
};

/**
 * Buyer-side resale checkout. Atomically reserves the listing (lock row,
 * flip status to RESERVED), creates an OrderType=RESALE row, creates a
 * ResaleOrder pivot, a payment, and returns a Wompi signature. Settlement
 * (ownership transfer + payout) runs later in `settle-resale-order` when
 * the webhook confirms payment.
 */
export class InitiateResaleCheckoutUseCase {
    constructor(
        private readonly dataSource: DataSource,
        private readonly listingRepo: IResaleListingRepository,
        private readonly resaleOrderRepo: IResaleOrderRepository,
        private readonly orderRepo: IOrderRepository,
        private readonly paymentRepo: IPaymentRepository,
        private readonly gateway: PaymentGatewayPort,
        private readonly config: InitiateResaleCheckoutConfig,
    ) {}

    async execute(
        buyerUserId: string,
        buyerEmail: string,
        dto: InitiateResaleCheckoutDto,
    ): Promise<InitiateCheckoutResponse> {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        let createdOrderId: string;
        let createdPaymentId: string;
        let reference: string;
        let amountInCents: number;
        let currency: string;
        let reservedUntilIso: string;
        try {
            const listingRow = await qr.manager.findOne(ResaleListingOrmEntity, {
                where: { id: dto.listingId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!listingRow) {
                throw new NotFoundDomainException('Listing not found');
            }
            if (listingRow.sellerUserId === buyerUserId) {
                throw new ForbiddenDomainException(
                    'Cannot buy your own listing',
                    'BUYER_IS_SELLER',
                );
            }
            if (listingRow.status !== ResaleListingStatus.ACTIVE) {
                throw new ConflictDomainException(
                    `Listing is not available (status: ${listingRow.status})`,
                    'LISTING_UNAVAILABLE',
                );
            }
            if (
                listingRow.expiresAt &&
                listingRow.expiresAt.getTime() <= Date.now()
            ) {
                throw new UnprocessableDomainException(
                    'Listing has expired',
                    'LISTING_EXPIRED',
                );
            }

            const now = new Date();
            const reservedUntil = new Date(
                now.getTime() + this.config.reservationMinutes * 60_000,
            );
            reservedUntilIso = reservedUntil.toISOString();

            // Flip listing to RESERVED and stamp the reservation
            await qr.manager.update(ResaleListingOrmEntity, listingRow.id, {
                status: ResaleListingStatus.RESERVED,
                reservedByUserId: buyerUserId,
                reservedUntil,
                updatedAt: now,
            });

            // Flip ticket status to RESERVED_FOR_RESALE for UI/consistency
            await qr.manager.update(TicketOrmEntity, listingRow.ticketId, {
                status: TicketStatus.RESERVED_FOR_RESALE,
                updatedAt: now,
            });

            reference = makeResalePaymentReference();
            amountInCents = listingRow.askPrice;
            currency = listingRow.currency;

            // The buyer's order — platformFeeTotal already known from listing
            const order = new OrderEntity({
                userId: buyerUserId,
                companyId: null,
                type: OrderType.RESALE,
                status: OrderStatus.AWAITING_PAYMENT,
                currency,
                subtotal: amountInCents,
                serviceFeeTotal: 0,
                platformFeeTotal: listingRow.platformFeeAmount,
                taxTotal: 0,
                grandTotal: amountInCents,
                paymentProvider: 'wompi',
                paymentReference: reference,
                reservedUntil,
                buyerFullName: dto.buyerFullName,
                buyerEmail: dto.buyerEmail || buyerEmail,
                buyerPhone: dto.buyerPhone ?? null,
                buyerLegalId: dto.buyerLegalId ?? null,
                buyerLegalIdType: dto.buyerLegalIdType ?? null,
            });
            const savedOrder = await this.orderRepo.create(order);
            createdOrderId = savedOrder.id;

            await this.resaleOrderRepo.create(
                new ResaleOrderEntity({
                    resaleListingId: listingRow.id,
                    buyerUserId,
                    orderId: savedOrder.id,
                    status: ResaleOrderStatus.PENDING,
                }),
            );

            const payment = new PaymentEntity({
                orderId: savedOrder.id,
                userId: buyerUserId,
                amount: amountInCents,
                currency,
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

        const signature = await this.gateway.generateSignature(
            reference,
            amountInCents,
            currency,
        );
        const publicKey = await this.gateway.getPublicKey();

        return {
            orderId: createdOrderId,
            paymentId: createdPaymentId,
            reference,
            amountInCents,
            currency,
            signature,
            publicKey,
            customerEmail: dto.buyerEmail || buyerEmail,
            customerFullName: dto.buyerFullName,
            customerPhone: dto.buyerPhone ?? '',
            customerLegalId: dto.buyerLegalId ?? '',
            customerLegalIdType: dto.buyerLegalIdType ?? '',
            reservedUntil: reservedUntilIso,
        };
    }
}
