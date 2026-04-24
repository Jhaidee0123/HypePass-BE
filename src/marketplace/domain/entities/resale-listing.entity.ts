import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { ResaleListingProps } from '../types/resale-listing.props';
import { ResaleListingStatus } from '../types/resale-listing-status';

export class ResaleListingEntity extends BaseEntity {
    readonly ticketId: string;
    readonly sellerUserId: string;
    readonly askPrice: number;
    readonly platformFeeAmount: number;
    readonly sellerNetAmount: number;
    readonly currency: string;
    readonly status: ResaleListingStatus;
    readonly note?: string | null;
    readonly reservedByUserId?: string | null;
    readonly reservedUntil?: Date | null;
    readonly expiresAt?: Date | null;
    readonly cancelledAt?: Date | null;
    readonly soldAt?: Date | null;

    constructor(props: ResaleListingProps) {
        super(props);
        this.ticketId = props.ticketId;
        this.sellerUserId = props.sellerUserId;
        this.askPrice = props.askPrice;
        this.platformFeeAmount = props.platformFeeAmount;
        this.sellerNetAmount = props.sellerNetAmount;
        this.currency = props.currency;
        this.status = props.status;
        this.note = props.note;
        this.reservedByUserId = props.reservedByUserId;
        this.reservedUntil = props.reservedUntil;
        this.expiresAt = props.expiresAt;
        this.cancelledAt = props.cancelledAt;
        this.soldAt = props.soldAt;
    }
}
