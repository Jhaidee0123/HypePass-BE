import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { OrderProps } from '../types/order.props';
import { OrderStatus, OrderType } from '../types/order-status';

export class OrderEntity extends BaseEntity {
    readonly userId: string;
    readonly companyId?: string | null;
    readonly type: OrderType;
    readonly status: OrderStatus;
    readonly currency: string;
    readonly subtotal: number;
    readonly serviceFeeTotal: number;
    readonly platformFeeTotal: number;
    readonly taxTotal: number;
    readonly grandTotal: number;
    readonly paymentProvider: string;
    readonly paymentReference: string;
    readonly reservedUntil?: Date | null;
    readonly buyerFullName: string;
    readonly buyerEmail: string;
    readonly buyerPhone?: string | null;
    readonly buyerLegalId?: string | null;
    readonly buyerLegalIdType?: string | null;
    readonly needsReconciliation: boolean;
    readonly reconciliationReason?: string | null;

    constructor(props: OrderProps) {
        super(props);
        this.userId = props.userId;
        this.companyId = props.companyId;
        this.type = props.type;
        this.status = props.status;
        this.currency = props.currency;
        this.subtotal = props.subtotal;
        this.serviceFeeTotal = props.serviceFeeTotal;
        this.platformFeeTotal = props.platformFeeTotal;
        this.taxTotal = props.taxTotal;
        this.grandTotal = props.grandTotal;
        this.paymentProvider = props.paymentProvider;
        this.paymentReference = props.paymentReference;
        this.reservedUntil = props.reservedUntil;
        this.buyerFullName = props.buyerFullName;
        this.buyerEmail = props.buyerEmail;
        this.buyerPhone = props.buyerPhone;
        this.buyerLegalId = props.buyerLegalId;
        this.buyerLegalIdType = props.buyerLegalIdType;
        this.needsReconciliation = props.needsReconciliation ?? false;
        this.reconciliationReason = props.reconciliationReason ?? null;
    }
}
