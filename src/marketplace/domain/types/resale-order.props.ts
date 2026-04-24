import { BaseProps } from '../../../shared/domain/types/base.props';
import { ResaleOrderStatus } from './resale-order-status';

export type ResaleOrderProps = BaseProps & {
    resaleListingId: string;
    buyerUserId: string;
    orderId: string;
    status: ResaleOrderStatus;
};
