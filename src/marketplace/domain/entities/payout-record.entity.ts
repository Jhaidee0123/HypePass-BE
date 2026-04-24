import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { PayoutRecordProps } from '../types/payout-record.props';
import {
    PayoutRecordStatus,
    PayoutTransactionType,
} from '../types/payout-record-status';

export class PayoutRecordEntity extends BaseEntity {
    readonly resaleListingId?: string | null;
    readonly sellerUserId?: string | null;
    readonly companyId?: string | null;
    readonly eventSessionId?: string | null;
    readonly transactionType: PayoutTransactionType;
    readonly grossAmount: number;
    readonly platformFee: number;
    readonly netAmount: number;
    readonly currency: string;
    readonly status: PayoutRecordStatus;
    readonly releaseAt?: Date | null;
    readonly settledAt?: Date | null;
    readonly payoutAccountType?: string | null;
    readonly payoutAccountBankName?: string | null;
    readonly payoutAccountNumber?: string | null;
    readonly payoutAccountHolderName?: string | null;
    readonly payoutAccountHolderLegalIdType?: string | null;
    readonly payoutAccountHolderLegalId?: string | null;

    constructor(props: PayoutRecordProps) {
        super(props);
        this.resaleListingId = props.resaleListingId;
        this.sellerUserId = props.sellerUserId;
        this.companyId = props.companyId;
        this.eventSessionId = props.eventSessionId ?? null;
        this.transactionType = props.transactionType;
        this.grossAmount = props.grossAmount;
        this.platformFee = props.platformFee;
        this.netAmount = props.netAmount;
        this.currency = props.currency;
        this.status = props.status;
        this.releaseAt = props.releaseAt ?? null;
        this.settledAt = props.settledAt ?? null;
        this.payoutAccountType = props.payoutAccountType ?? null;
        this.payoutAccountBankName = props.payoutAccountBankName ?? null;
        this.payoutAccountNumber = props.payoutAccountNumber ?? null;
        this.payoutAccountHolderName = props.payoutAccountHolderName ?? null;
        this.payoutAccountHolderLegalIdType =
            props.payoutAccountHolderLegalIdType ?? null;
        this.payoutAccountHolderLegalId =
            props.payoutAccountHolderLegalId ?? null;
    }
}
