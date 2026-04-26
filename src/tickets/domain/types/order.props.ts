import { BaseProps } from '../../../shared/domain/types/base.props';
import { OrderStatus, OrderType } from './order-status';

export type OrderProps = BaseProps & {
    userId: string;
    companyId?: string | null;
    type: OrderType;
    status: OrderStatus;
    currency: string;
    subtotal: number;
    serviceFeeTotal: number;
    platformFeeTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentProvider: string;
    paymentReference: string;
    reservedUntil?: Date | null;
    buyerFullName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    buyerLegalId?: string | null;
    buyerLegalIdType?: string | null;
    needsReconciliation?: boolean;
    reconciliationReason?: string | null;
    promoterReferralCode?: string | null;
};
