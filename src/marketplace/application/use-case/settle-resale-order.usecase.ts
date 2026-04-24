import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { OrderEntity } from '../../../tickets/domain/entities/order.entity';
import { IOrderRepository } from '../../../tickets/domain/repositories/order.repository';
import { OrderStatus } from '../../../tickets/domain/types/order-status';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { ITicketQrTokenRepository } from '../../../tickets/domain/repositories/ticket-qr-token.repository';
import { ResaleListingOrmEntity } from '../../infrastructure/orm/resale-listing.orm.entity';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';
import { ResaleOrderEntity } from '../../domain/entities/resale-order.entity';
import { ResaleOrderStatus } from '../../domain/types/resale-order-status';
import { IResaleOrderRepository } from '../../domain/repositories/resale-order.repository';
import { PayoutRecordEntity } from '../../domain/entities/payout-record.entity';
import { IPayoutRecordRepository } from '../../domain/repositories/payout-record.repository';
import {
    PayoutRecordStatus,
    PayoutTransactionType,
} from '../../domain/types/payout-record-status';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { IPayoutMethodRepository } from '../../../payout-methods/domain/repositories/payout-method.repository';

/**
 * Settles a paid resale order. Idempotent: if the ticket has already been
 * transferred to the buyer, returns without side-effects. Runs inside a
 * transaction with pessimistic locks on both the listing and the ticket.
 *
 * Steps (atomic):
 *   1. lock listing + ticket
 *   2. transfer ownership (bump ownershipVersion + qrGenerationVersion)
 *   3. set ticket.status = ISSUED (cleared from RESERVED_FOR_RESALE)
 *   4. deactivate any previous QR tokens
 *   5. flip listing to SOLD + stamp soldAt
 *   6. flip resaleOrder to SETTLED
 *   7. create PayoutRecord for the seller in PAYABLE status
 */
export class SettleResaleOrderUseCase {
    private readonly logger = new Logger(SettleResaleOrderUseCase.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly resaleOrderRepo: IResaleOrderRepository,
        private readonly orderRepo: IOrderRepository,
        private readonly payoutRepo: IPayoutRecordRepository,
        private readonly qrTokenRepo: ITicketQrTokenRepository,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly payoutMethodRepo: IPayoutMethodRepository,
        private readonly config: { escrowHoursAfterEvent: number },
    ) {}

    async execute(order: OrderEntity): Promise<void> {
        const resaleOrder = await this.resaleOrderRepo.findByOrder(order.id);
        if (!resaleOrder) {
            this.logger.warn(
                `settleResaleOrder: no resale-order pivot for order ${order.id}`,
            );
            return;
        }
        if (resaleOrder.status === ResaleOrderStatus.SETTLED) return; // idempotent

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const listing = await qr.manager.findOne(ResaleListingOrmEntity, {
                where: { id: resaleOrder.resaleListingId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!listing) {
                throw new Error(
                    `Listing ${resaleOrder.resaleListingId} not found`,
                );
            }
            const ticket = await qr.manager.findOne(TicketOrmEntity, {
                where: { id: listing.ticketId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!ticket) {
                throw new Error(`Ticket ${listing.ticketId} not found`);
            }

            // Idempotency: if the ticket already belongs to the buyer, assume
            // settlement already ran.
            if (ticket.currentOwnerUserId === resaleOrder.buyerUserId) {
                await qr.commitTransaction();
                return;
            }

            const now = new Date();
            const newOwnershipVersion = ticket.ownershipVersion + 1;
            const newQrGenerationVersion = ticket.qrGenerationVersion + 1;

            await qr.manager.update(TicketOrmEntity, ticket.id, {
                currentOwnerUserId: resaleOrder.buyerUserId,
                ownershipVersion: newOwnershipVersion,
                qrGenerationVersion: newQrGenerationVersion,
                status: TicketStatus.ISSUED,
                latestSalePrice: listing.askPrice,
                updatedAt: now,
            });

            await this.qrTokenRepo.deactivateAllForTicket(ticket.id);

            await qr.manager.update(ResaleListingOrmEntity, listing.id, {
                status: ResaleListingStatus.SOLD,
                soldAt: now,
                updatedAt: now,
            });

            await this.resaleOrderRepo.update(
                new ResaleOrderEntity({
                    ...resaleOrder,
                    id: resaleOrder.id,
                    createdAt: resaleOrder.createdAt,
                    status: ResaleOrderStatus.SETTLED,
                    updatedAt: now,
                } as any),
            );

            if (order.status !== OrderStatus.PAID) {
                await this.orderRepo.update(
                    new OrderEntity({
                        ...order,
                        id: order.id,
                        createdAt: order.createdAt,
                        status: OrderStatus.PAID,
                        updatedAt: now,
                    } as any),
                );
            }

            // Snapshot the seller's default payout method so the admin has
            // dispersement info even if the seller later deletes/changes it.
            const payoutMethod =
                await this.payoutMethodRepo.findDefaultForUser(
                    listing.sellerUserId,
                );

            // Compute release_at: event.endsAt + escrow_hours. Fallback to
            // now if the session can't be resolved (shouldn't happen).
            const session = await this.sessionRepo.findById(
                ticket.eventSessionId,
            );
            const escrowMs =
                this.config.escrowHoursAfterEvent * 60 * 60 * 1000;
            const releaseAt = session
                ? new Date(session.endsAt.getTime() + escrowMs)
                : new Date(now.getTime() + escrowMs);

            await this.payoutRepo.create(
                new PayoutRecordEntity({
                    resaleListingId: listing.id,
                    sellerUserId: listing.sellerUserId,
                    companyId: null,
                    eventSessionId: ticket.eventSessionId,
                    transactionType: PayoutTransactionType.RESELLER_PAYOUT,
                    grossAmount: listing.askPrice,
                    platformFee: listing.platformFeeAmount,
                    netAmount: listing.sellerNetAmount,
                    currency: listing.currency,
                    status: PayoutRecordStatus.PENDING_EVENT,
                    releaseAt,
                    payoutAccountType: payoutMethod?.type ?? null,
                    payoutAccountBankName: payoutMethod?.bankName ?? null,
                    payoutAccountNumber: payoutMethod?.accountNumber ?? null,
                    payoutAccountHolderName:
                        payoutMethod?.holderName ?? null,
                    payoutAccountHolderLegalIdType:
                        payoutMethod?.holderLegalIdType ?? null,
                    payoutAccountHolderLegalId:
                        payoutMethod?.holderLegalId ?? null,
                }),
            );

            await qr.commitTransaction();

            await this.notify(
                listing.sellerUserId,
                resaleOrder.buyerUserId,
                order.buyerFullName,
                listing.askPrice,
                listing.sellerNetAmount,
                listing.currency,
            );
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    /**
     * Release a reserved listing back to ACTIVE when the buyer's payment
     * fails or is voided. Idempotent — only affects listings in RESERVED.
     */
    async release(order: OrderEntity): Promise<void> {
        const resaleOrder = await this.resaleOrderRepo.findByOrder(order.id);
        if (!resaleOrder) return;
        if (
            resaleOrder.status === ResaleOrderStatus.SETTLED ||
            resaleOrder.status === ResaleOrderStatus.FAILED
        ) {
            return;
        }

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const listing = await qr.manager.findOne(ResaleListingOrmEntity, {
                where: { id: resaleOrder.resaleListingId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!listing) return;

            const now = new Date();
            if (listing.status === ResaleListingStatus.RESERVED) {
                await qr.manager.update(ResaleListingOrmEntity, listing.id, {
                    status: ResaleListingStatus.ACTIVE,
                    reservedByUserId: null,
                    reservedUntil: null,
                    updatedAt: now,
                });
                await qr.manager.update(TicketOrmEntity, listing.ticketId, {
                    status: TicketStatus.LISTED,
                    updatedAt: now,
                });
            }

            await this.resaleOrderRepo.update(
                new ResaleOrderEntity({
                    ...resaleOrder,
                    id: resaleOrder.id,
                    createdAt: resaleOrder.createdAt,
                    status: ResaleOrderStatus.FAILED,
                    updatedAt: now,
                } as any),
            );

            await qr.commitTransaction();
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    private async notify(
        sellerUserId: string,
        buyerUserId: string,
        buyerFullName: string,
        grossAmount: number,
        sellerNetAmount: number,
        currency: string,
    ): Promise<void> {
        try {
            const [seller, buyer] = await Promise.all([
                this.userRepo.findById(sellerUserId),
                this.userRepo.findById(buyerUserId),
            ]);

            const fmt = (n: number) =>
                `$${(n / 100).toLocaleString('es-CO')} ${currency}`;

            if (seller?.email) {
                const body = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Tu ticket se vendió</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Tu listing en HypePass fue comprado por <strong style="color:#faf7f0;">${buyerFullName}</strong>. Ya procesamos la transferencia del ticket.</p>
<div style="padding:14px 16px;background:#121110;border:1px solid #242320;border-radius:4px;margin:0 0 18px;">
  <div style="font-family:'Courier New',monospace;font-size:10px;color:#6b6760;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Recibirás (neto)</div>
  <div style="color:#d7ff3a;font-size:24px;font-family:Impact,sans-serif;letter-spacing:0.02em;">${fmt(sellerNetAmount)}</div>
  <div style="font-family:'Courier New',monospace;font-size:10px;color:#6b6760;letter-spacing:0.1em;text-transform:uppercase;margin:12px 0 6px;">Bruto / Comisión</div>
  <div style="color:#ece8e0;font-size:13px;">${fmt(grossAmount)} · comisión ${fmt(grossAmount - sellerNetAmount)}</div>
</div>
<p style="margin:0;color:#bfbab1;font-size:13px;">Los pagos a revendedores se procesan en el siguiente ciclo de settlement.</p>
`.trim();
                await this.email.send({
                    to: seller.email,
                    subject: `HypePass — Tu ticket se vendió`,
                    body,
                });
            }

            if (buyer?.email) {
                const body = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">¡Ticket tuyo!</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Tu compra en el marketplace fue confirmada y el ticket ya está en tu wallet.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/wallet" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ver mi wallet</a></p>
`.trim();
                await this.email.send({
                    to: buyer.email,
                    subject: `HypePass — Compra en el marketplace confirmada`,
                    body,
                });
            }
        } catch {
            /* logged in EmailService */
        }
    }
}
