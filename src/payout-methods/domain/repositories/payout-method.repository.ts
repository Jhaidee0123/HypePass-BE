import { PayoutMethodEntity } from '../entities/payout-method.entity';

export interface IPayoutMethodRepository {
    findById(id: string): Promise<PayoutMethodEntity | null>;
    findByUser(userId: string): Promise<PayoutMethodEntity[]>;
    findDefaultForUser(userId: string): Promise<PayoutMethodEntity | null>;
    create(entity: PayoutMethodEntity): Promise<PayoutMethodEntity>;
    update(entity: PayoutMethodEntity): Promise<PayoutMethodEntity>;
    /**
     * Atomically makes one method the default for a user, clearing the flag
     * on every other method of the same user. Returns the updated default.
     */
    setDefault(
        userId: string,
        payoutMethodId: string,
    ): Promise<PayoutMethodEntity>;
    delete(id: string): Promise<void>;
}
