import { BaseProps } from '../../../shared/domain/types/base.props';
import {
    PayoutRecordStatus,
    PayoutTransactionType,
} from './payout-record-status';

export type PayoutRecordProps = BaseProps & {
    resaleListingId?: string | null;
    sellerUserId?: string | null;
    companyId?: string | null;
    eventSessionId?: string | null;
    transactionType: PayoutTransactionType;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    currency: string;
    status: PayoutRecordStatus;
    /** Earliest time a PENDING_EVENT payout may be released. Null if not gated. */
    releaseAt?: Date | null;
    /** Timestamp of the last paid/failed/cancelled transition. */
    settledAt?: Date | null;
    /** Snapshot of the seller's payout method at the moment of settlement. */
    payoutAccountType?: string | null;
    payoutAccountBankName?: string | null;
    payoutAccountNumber?: string | null;
    payoutAccountHolderName?: string | null;
    payoutAccountHolderLegalIdType?: string | null;
    payoutAccountHolderLegalId?: string | null;
    /** Provider that processed the disbursement, e.g. 'wompi' | 'mercadopago'. */
    providerName?: string | null;
    /** Provider's transaction id for the disbursement (Wompi payout id, etc). */
    providerReference?: string | null;
    /** Human-readable reason when status is FAILED. Helps ops triage. */
    failureReason?: string | null;
};
