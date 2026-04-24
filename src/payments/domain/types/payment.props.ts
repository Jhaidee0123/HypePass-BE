import { BaseProps } from '../../../shared/domain/types/base.props';
import { PaymentStatus } from './payment-status';

export type PaymentProps = BaseProps & {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider: string;
    providerReference: string;
    providerTransactionId?: string | null;
    rawProviderPayload?: unknown;
};
