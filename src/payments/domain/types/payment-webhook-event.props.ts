import { BaseProps } from '../../../shared/domain/types/base.props';

export type PaymentWebhookEventProps = BaseProps & {
    provider: string;
    providerEventId?: string | null;
    eventType: string;
    idempotencyKey?: string | null;
    payload: unknown;
    processedAt?: Date | null;
    processingStatus: string;
};
