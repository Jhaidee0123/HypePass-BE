import { PaymentWebhookEventEntity } from '../../domain/entities/payment-webhook-event.entity';
import { PaymentWebhookEventOrmEntity } from '../orm/payment-webhook-event.orm.entity';

export class PaymentWebhookEventMapper {
    static toDomain(
        orm: PaymentWebhookEventOrmEntity,
    ): PaymentWebhookEventEntity {
        return new PaymentWebhookEventEntity({
            id: orm.id,
            provider: orm.provider,
            providerEventId: orm.providerEventId,
            eventType: orm.eventType,
            idempotencyKey: orm.idempotencyKey,
            payload: orm.payload,
            processedAt: orm.processedAt,
            processingStatus: orm.processingStatus,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: PaymentWebhookEventEntity,
    ): Partial<PaymentWebhookEventOrmEntity> {
        return {
            id: entity.id,
            provider: entity.provider,
            providerEventId: entity.providerEventId ?? null,
            eventType: entity.eventType,
            idempotencyKey: entity.idempotencyKey ?? null,
            payload: entity.payload as Record<string, any>,
            processedAt: entity.processedAt ?? null,
            processingStatus: entity.processingStatus,
        };
    }
}
