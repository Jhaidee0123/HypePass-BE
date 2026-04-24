import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { PayoutMethodEntity } from '../../domain/entities/payout-method.entity';
import { IPayoutMethodRepository } from '../../domain/repositories/payout-method.repository';

export class MakeDefaultPayoutMethodUseCase {
    constructor(private readonly repo: IPayoutMethodRepository) {}

    async execute(
        userId: string,
        payoutMethodId: string,
    ): Promise<PayoutMethodEntity> {
        const current = await this.repo.findById(payoutMethodId);
        if (!current) {
            throw new NotFoundDomainException('Payout method not found');
        }
        if (current.userId !== userId) {
            throw new ForbiddenDomainException('Not your payout method');
        }
        return this.repo.setDefault(userId, payoutMethodId);
    }
}
