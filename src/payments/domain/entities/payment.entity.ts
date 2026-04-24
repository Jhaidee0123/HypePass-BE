import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { PaymentProps } from '../types/payment.props';
import { PaymentStatus } from '../types/payment-status';

export class PaymentEntity extends BaseEntity {
    readonly orderId: string;
    readonly userId: string;
    readonly amount: number;
    readonly currency: string;
    readonly status: PaymentStatus;
    readonly provider: string;
    readonly providerReference: string;
    readonly providerTransactionId?: string | null;
    readonly rawProviderPayload?: unknown;

    constructor(props: PaymentProps) {
        super(props);
        this.orderId = props.orderId;
        this.userId = props.userId;
        this.amount = props.amount;
        this.currency = props.currency;
        this.status = props.status;
        this.provider = props.provider;
        this.providerReference = props.providerReference;
        this.providerTransactionId = props.providerTransactionId;
        this.rawProviderPayload = props.rawProviderPayload;
    }
}
