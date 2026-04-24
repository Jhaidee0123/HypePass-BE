import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { PaymentWebhookEventProps } from '../types/payment-webhook-event.props';

export class PaymentWebhookEventEntity extends BaseEntity {
    readonly provider: string;
    readonly providerEventId?: string | null;
    readonly eventType: string;
    readonly idempotencyKey?: string | null;
    readonly payload: unknown;
    readonly processedAt?: Date | null;
    readonly processingStatus: string;

    constructor(props: PaymentWebhookEventProps) {
        super(props);
        this.provider = props.provider;
        this.providerEventId = props.providerEventId;
        this.eventType = props.eventType;
        this.idempotencyKey = props.idempotencyKey;
        this.payload = props.payload;
        this.processedAt = props.processedAt;
        this.processingStatus = props.processingStatus;
    }
}
