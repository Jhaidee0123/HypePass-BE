import { PaymentWebhookEventEntity } from '../entities/payment-webhook-event.entity';

export interface IPaymentWebhookEventRepository {
    findByProviderEventId(
        provider: string,
        providerEventId: string,
    ): Promise<PaymentWebhookEventEntity | null>;
    create(
        entity: PaymentWebhookEventEntity,
    ): Promise<PaymentWebhookEventEntity>;
    update(
        entity: PaymentWebhookEventEntity,
    ): Promise<PaymentWebhookEventEntity>;
}
