import { BaseProps } from '../../../shared/domain/types/base.props';

export type OrderItemProps = BaseProps & {
    orderId: string;
    eventId: string;
    eventSessionId: string;
    ticketSectionId: string;
    ticketSalePhaseId: string | null;
    quantity: number;
    unitPrice: number;
    serviceFee: number;
    platformFee: number;
    taxAmount: number;
    lineTotal: number;
};
