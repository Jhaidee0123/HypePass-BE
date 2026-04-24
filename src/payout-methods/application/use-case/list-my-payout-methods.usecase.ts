import { PayoutMethodEntity } from '../../domain/entities/payout-method.entity';
import { IPayoutMethodRepository } from '../../domain/repositories/payout-method.repository';

export class ListMyPayoutMethodsUseCase {
    constructor(private readonly repo: IPayoutMethodRepository) {}

    execute(userId: string): Promise<PayoutMethodEntity[]> {
        return this.repo.findByUser(userId);
    }
}
