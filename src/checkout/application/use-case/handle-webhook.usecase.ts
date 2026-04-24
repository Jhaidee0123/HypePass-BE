import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { PaymentGatewayPort } from '../../../payments/domain/ports/payment-gateway.port';
import { IPaymentRepository } from '../../../payments/domain/repositories/payment.repository';
import { IPaymentWebhookEventRepository } from '../../../payments/domain/repositories/payment-webhook-event.repository';
import { PaymentWebhookEventEntity } from '../../../payments/domain/entities/payment-webhook-event.entity';
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

export class HandleWebhookUseCase {
    private readonly logger = new Logger(HandleWebhookUseCase.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly gateway: PaymentGatewayPort,
        private readonly paymentRepo: IPaymentRepository,
        private readonly webhookRepo: IPaymentWebhookEventRepository,
        private readonly orderRepo: IOrderRepository,
        private readonly orderItemRepo: IOrderItemRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly inventoryHoldRepo: IInventoryHoldRepository,
        private readonly email: EmailService,
        private readonly settleResaleOrder: SettleResaleOrderUseCase,
    ) {}

    async execute(payload: any): Promise<{ received: boolean }> {
        if (!this.gateway.verifyWebhookSignature(payload)) {
            this.logger.warn('Wompi webhook with invalid signature — ignoring');
            return { received: true };
        }

        const provider = 'wompi';
        const providerEventId =
            (payload?.signature?.checksum as string | undefined) ?? null;
        const eventType = payload?.event ?? 'unknown';

        // Idempotency: if we already processed this provider_event_id, short-circuit.
        if (providerEventId) {
            const seen = await this.webhookRepo.findByProviderEventId(
                provider,
                providerEventId,
            );
            if (seen?.processedAt) {
                return { received: true };
            }
        }

        const log = await this.webhookRepo.create(
            new PaymentWebhookEventEntity({
                provider,
                providerEventId,
                eventType,
                payload,
                processingStatus: 'processing',
            }),
        );

        try {
            if (eventType === 'transaction.updated') {
                await this.processTransaction(payload);
            }

            await this.webhookRepo.update(
                new PaymentWebhookEventEntity({
                    ...log,
                    id: log.id,
                    createdAt: log.createdAt,
                    processedAt: new Date(),
                    processingStatus: 'processed',
                    updatedAt: new Date(),
                } as any),
            );
        } catch (err: any) {
            this.logger.error(
                `Webhook processing failed: ${err?.message ?? 'unknown'}`,
            );
            await this.webhookRepo.update(
                new PaymentWebhookEventEntity({
                    ...log,
                    id: log.id,
                    createdAt: log.createdAt,
                    processedAt: new Date(),
                    processingStatus: 'failed',
                    updatedAt: new Date(),
                } as any),
            );
        }

        return { received: true };
    }

    private async processTransaction(payload: any): Promise<void> {
        const transaction = payload?.data?.transaction;
        if (!transaction) return;

        const reference = transaction.reference;
        const payment = await this.paymentRepo.findByReference(reference);
        if (!payment) {
            this.logger.warn(
                `Webhook: no payment found for reference ${reference}`,
            );
            return;
        }
        if (FINAL_PAYMENT_STATUSES.includes(payment.status)) {
            return; // already finalised
        }

        const order = await this.orderRepo.findById(payment.orderId);
        if (!order) {
            this.logger.warn(
                `Webhook: no order found for payment ${payment.id}`,
            );
            return;
        }

        const status: string = transaction.status;
        if (status === 'APPROVED') {
            await this.paymentRepo.update(
                new PaymentEntity({
                    ...payment,
                    id: payment.id,
                    createdAt: payment.createdAt,
                    status: PaymentStatus.COMPLETED,
                    providerTransactionId: transaction.id,
                    rawProviderPayload: transaction,
                    updatedAt: new Date(),
                } as any),
            );
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
            }
        } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) {
            await this.paymentRepo.update(
                new PaymentEntity({
                    ...payment,
                    id: payment.id,
                    createdAt: payment.createdAt,
                    status: PaymentStatus.FAILED,
                    providerTransactionId: transaction.id,
                    rawProviderPayload: transaction,
                    updatedAt: new Date(),
                } as any),
            );
            if (order.status !== OrderStatus.FAILED) {
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
            if (order.type === OrderType.RESALE) {
                await this.settleResaleOrder.release(order);
            }
        }
    }
}
