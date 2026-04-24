import { PayoutRecordEntity } from '../entities/payout-record.entity';
import { PayoutRecordStatus } from '../types/payout-record-status';

export type PayoutRecordFilter = {
    status?: PayoutRecordStatus;
    sellerUserId?: string;
};

export interface IPayoutRecordRepository {
    findById(id: string): Promise<PayoutRecordEntity | null>;
    findBySeller(userId: string): Promise<PayoutRecordEntity[]>;
    findByListing(listingId: string): Promise<PayoutRecordEntity[]>;
    findAll(filter?: PayoutRecordFilter): Promise<PayoutRecordEntity[]>;
    create(entity: PayoutRecordEntity): Promise<PayoutRecordEntity>;
    update(entity: PayoutRecordEntity): Promise<PayoutRecordEntity>;
}
