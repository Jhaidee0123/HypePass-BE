import { PayoutRecordEntity } from '../../../domain/entities/payout-record.entity';
import {
    IPayoutRecordRepository,
    PayoutRecordFilter,
} from '../../../domain/repositories/payout-record.repository';

export class ListPayoutsUseCase {
    constructor(private readonly repo: IPayoutRecordRepository) {}

    execute(filter?: PayoutRecordFilter): Promise<PayoutRecordEntity[]> {
        return this.repo.findAll(filter);
    }
}
