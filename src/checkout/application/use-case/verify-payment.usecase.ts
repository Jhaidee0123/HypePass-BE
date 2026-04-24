import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { PaymentGatewayPort } from '../../../payments/domain/ports/payment-gateway.port';
import { IPaymentRepository } from '../../../payments/domain/repositories/payment.repository';
import { PaymentEntity } from '../../../payments/domain/entities/payment.entity';
import {
    FINAL_PAYMENT_STATUSES,
    PaymentStatus,
} from '../../../payments/domain/types/payment-status';
import { IOrderRepository } from '../../../tickets/domain/repositories/order.repository';
import { IOrderItemRepository } from '../../../tickets/domain/repositories/order-item.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { IInventoryHoldRepository } from '../../../tickets/domain/repositories/inventory-hold.repository';
import { OrderEntity } from '../../../tickets/domain/entities/order.entity';
import {
    OrderStatus,
    OrderType,
} from '../../../tickets/domain/types/order-status';
import { issueTicketsForOrder } from './helpers/issue-tickets';
import { SettleResaleOrderUseCase } from '../../../marketplace/application/use-case/settle-resale-order.usecase';

export type VerifyPaymentResult = {
    paymentId: string;
    orderId: string;
    status: PaymentStatus;
    orderStatus: OrderStatus;
    amount: number;
    currency: string;
    reference: string;
    ticketIds: string[];
};

/**
 * Called by the FE while polling `/checkout/verify/:reference`. If the payment
 * record is still PENDING/PROCESSING, we query Wompi and, if approved, issue
 * the tickets. Safe to call multiple times (idempotent via `issueTicketsForOrder`).
 */
export class VerifyPaymentUseCase {
    private readonly logger = new Logger(VerifyPaymentUseCase.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly paymentRepo: IPaymentRepository,
        private readonly orderRepo: IOrderRepository,
        private readonly orderItemRepo: IOrderItemRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly inventoryHoldRepo: IInventoryHoldRepository,
        private readonly gateway: PaymentGatewayPort,
        private readonly email: EmailService,
        private readonly settleResaleOrder: SettleResaleOrderUseCase,
    ) {}

    async execute(reference: string): Promise<VerifyPaymentResult> {
        const payment = await this.paymentRepo.findByReference(reference);
        if (!payment) throw new NotFoundDomainException('Payment not found');

        let current = payment;
        if (!FINAL_PAYMENT_STATUSES.includes(payment.status)) {
            const wompiTx = await this.gateway
                .getTransactionByReference(reference)
                .catch((err) => {
                    this.logger.warn(
                        `Wompi lookup failed for ${reference}: ${err?.message}`,
                    );
                    return null;
                });

            if (wompiTx) {
                current = await this.applyWompiStatus(payment, wompiTx);
            }
        }

        const order = await this.orderRepo.findById(current.orderId);
        if (!order) throw new NotFoundDomainException('Order not found');

        const tickets = await this.ticketRepo.findByOrder(order.id);

        return {
            paymentId: current.id,
            orderId: order.id,
            status: current.status,
            orderStatus: order.status,
            amount: current.amount,
            currency: current.currency,
            reference: current.providerReference,
            ticketIds: tickets.map((t) => t.id),
        };
    }

    private async applyWompiStatus(
        payment: PaymentEntity,
        wompiTx: any,
    ): Promise<PaymentEntity> {
        const status: string = wompiTx.status;
        if (status === 'APPROVED') {
            const updated = await this.paymentRepo.update(
                new PaymentEntity({
                    ...payment,
                    id: payment.id,
                    createdAt: payment.createdAt,
                    status: PaymentStatus.COMPLETED,
                    providerTransactionId: wompiTx.id,
                    rawProviderPayload: wompiTx,
                    updatedAt: new Date(),
                } as any),
            );
            const order = await this.orderRepo.findById(updated.orderId);
            if (order) {
                if (order.type === OrderType.RESALE) {
                    await this.settleResaleOrder.execute(order);
                } else {
                    await issueTicketsForOrder(
                        this.dataSource,
                        {
                            orderRepo: this.orderRepo,
                            orderItemRepo: this.orderItemRepo,
                            ticketRepo: this.ticketRepo,
                            inventoryHoldRepo: this.inventoryHoldRepo,
                        },
                        order,
                    );
                    await this.sendReceipt(order);
                }
            }
            return updated;
        }

        if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) {
            const updated = await this.paymentRepo.update(
                new PaymentEntity({
                    ...payment,
                    id: payment.id,
                    createdAt: payment.createdAt,
                    status: PaymentStatus.FAILED,
                    providerTransactionId: wompiTx.id,
                    rawProviderPayload: wompiTx,
                    updatedAt: new Date(),
                } as any),
            );
            const order = await this.orderRepo.findById(updated.orderId);
            if (order && order.status !== OrderStatus.FAILED) {
                await this.orderRepo.update(
                    new OrderEntity({
                        ...order,
                        id: order.id,
                        createdAt: order.createdAt,
                        status: OrderStatus.FAILED,
                        updatedAt: new Date(),
                    } as any),
                );
            }
            if (order && order.type === OrderType.RESALE) {
                await this.settleResaleOrder.release(order);
            }
            return updated;
        }

        return payment;
    }

    private async sendReceipt(order: OrderEntity): Promise<void> {
        try {
            const body = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">¡Tu compra está confirmada!</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Hola <strong style="color:#faf7f0;">${order.buyerFullName}</strong>, tu pago fue aprobado.</p>
<div style="padding:14px 16px;background:#121110;border:1px solid #242320;border-radius:4px;margin:0 0 18px;">
  <div style="font-family:'Courier New',monospace;font-size:10px;color:#6b6760;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Referencia</div>
  <div style="color:#ece8e0;font-size:14px;font-family:'Courier New',monospace;">${order.paymentReference}</div>
  <div style="font-family:'Courier New',monospace;font-size:10px;color:#6b6760;letter-spacing:0.1em;text-transform:uppercase;margin:12px 0 6px;">Total</div>
  <div style="color:#d7ff3a;font-size:24px;font-family:Impact,sans-serif;letter-spacing:0.02em;">$${(order.grandTotal / 100).toLocaleString('es-CO')} ${order.currency}</div>
</div>
<p style="margin:0 0 14px;color:#bfbab1;">Tus tickets ya están en tu wallet. El código QR se habilita unas horas antes del evento.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/wallet" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ver mis tickets</a></p>
`.trim();
            await this.email.send({
                to: order.buyerEmail,
                subject: `HypePass — Compra confirmada #${order.paymentReference}`,
                body,
            });
        } catch {
            /* logged in EmailService */
        }
    }
}
