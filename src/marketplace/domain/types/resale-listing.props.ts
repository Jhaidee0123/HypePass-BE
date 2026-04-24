import { BaseProps } from '../../../shared/domain/types/base.props';
import { ResaleListingStatus } from './resale-listing-status';

export type ResaleListingProps = BaseProps & {
    ticketId: string;
    sellerUserId: string;
    askPrice: number;
    platformFeeAmount: number;
    sellerNetAmount: number;
    currency: string;
    status: ResaleListingStatus;
    note?: string | null;
    reservedByUserId?: string | null;
    reservedUntil?: Date | null;
    expiresAt?: Date | null;
    cancelledAt?: Date | null;
    soldAt?: Date | null;
};
