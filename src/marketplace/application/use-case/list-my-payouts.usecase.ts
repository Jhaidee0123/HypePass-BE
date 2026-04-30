import { IPayoutRecordRepository } from '../../domain/repositories/payout-record.repository';
import { PayoutRecordEntity } from '../../domain/entities/payout-record.entity';

/**
 * Returns the calling user's PayoutRecords (most recent first). Used by
 * the organizer "Mis liquidaciones" panel and by sellers checking the
 * status of their resale payouts.
 */
export class ListMyPayoutsUseCase {
    constructor(private readonly repo: IPayoutRecordRepository) {}

    execute(userId: string): Promise<PayoutRecordEntity[]> {
        return this.repo.findBySeller(userId);
    }
}
