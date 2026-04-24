import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IPayoutMethodRepository } from '../../domain/repositories/payout-method.repository';

/**
 * Deleting a payout method is allowed any time — but if the user has
 * pending payouts in escrow, block it so the snapshot-based history stays
 * accurate. (We snapshot details into payout_records at settle time, so
 * deletion doesn't break past payouts; blocking is just UX guardrail.)
 */
export class DeletePayoutMethodUseCase {
    constructor(private readonly repo: IPayoutMethodRepository) {}

    async execute(userId: string, payoutMethodId: string): Promise<void> {
        const current = await this.repo.findById(payoutMethodId);
        if (!current) {
            throw new NotFoundDomainException('Payout method not found');
        }
        if (current.userId !== userId) {
            throw new ForbiddenDomainException('Not your payout method');
        }
        const all = await this.repo.findByUser(userId);
        if (current.isDefault && all.length > 1) {
            throw new ConflictDomainException(
                'Cannot delete the default payout method. Set another as default first.',
                'DELETE_DEFAULT_BLOCKED',
            );
        }
        await this.repo.delete(payoutMethodId);
    }
}
