import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { ResaleOrderProps } from '../types/resale-order.props';
import { ResaleOrderStatus } from '../types/resale-order-status';

export class ResaleOrderEntity extends BaseEntity {
    readonly resaleListingId: string;
    readonly buyerUserId: string;
    readonly orderId: string;
    readonly status: ResaleOrderStatus;

    constructor(props: ResaleOrderProps) {
        super(props);
        this.resaleListingId = props.resaleListingId;
        this.buyerUserId = props.buyerUserId;
        this.orderId = props.orderId;
        this.status = props.status;
    }
}
