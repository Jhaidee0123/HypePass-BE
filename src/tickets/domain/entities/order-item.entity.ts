import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { OrderItemProps } from '../types/order-item.props';

export class OrderItemEntity extends BaseEntity {
    readonly orderId: string;
    readonly eventId: string;
    readonly eventSessionId: string;
    readonly ticketSectionId: string;
    readonly ticketSalePhaseId: string | null;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly serviceFee: number;
    readonly platformFee: number;
    readonly taxAmount: number;
    readonly lineTotal: number;

    constructor(props: OrderItemProps) {
        super(props);
        this.orderId = props.orderId;
        this.eventId = props.eventId;
        this.eventSessionId = props.eventSessionId;
        this.ticketSectionId = props.ticketSectionId;
        this.ticketSalePhaseId = props.ticketSalePhaseId;
        this.quantity = props.quantity;
        this.unitPrice = props.unitPrice;
        this.serviceFee = props.serviceFee;
        this.platformFee = props.platformFee;
        this.taxAmount = props.taxAmount;
        this.lineTotal = props.lineTotal;
    }
}
