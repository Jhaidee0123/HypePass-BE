import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { PayoutMethodEntity } from '../../domain/entities/payout-method.entity';
import { IPayoutMethodRepository } from '../../domain/repositories/payout-method.repository';
import { PayoutMethodType } from '../../domain/types/payout-method-type';
import { CreatePayoutMethodDto } from '../dto/create-payout-method.dto';

/**
 * Registers a new payout destination for a user. If the user has no other
 * method, the new one is marked default automatically. If `makeDefault` is
 * true it becomes the default and demotes any previous default.
 */
export class CreatePayoutMethodUseCase {
    constructor(private readonly repo: IPayoutMethodRepository) {}

    async execute(
        userId: string,
        dto: CreatePayoutMethodDto,
    ): Promise<PayoutMethodEntity> {
        if (
            dto.type === PayoutMethodType.OTHER_BANK &&
            !(dto.bankName && dto.bankName.trim())
        ) {
            throw new UnprocessableDomainException(
                'bankName is required when type is OTHER_BANK',
                'BANK_NAME_REQUIRED',
            );
        }

        const existing = await this.repo.findByUser(userId);
        const makeDefault = dto.makeDefault ?? existing.length === 0;

        const created = await this.repo.create(
            new PayoutMethodEntity({
                userId,
                type: dto.type,
                bankName: dto.bankName ?? null,
                accountNumber: dto.accountNumber.trim(),
                holderName: dto.holderName.trim(),
                holderLegalIdType: dto.holderLegalIdType.toUpperCase(),
                holderLegalId: dto.holderLegalId.trim(),
                isDefault: makeDefault && existing.length === 0,
            }),
        );

        // If there were other methods and caller asked to make this default,
        // run the atomic setDefault so only one default remains.
        if (makeDefault && existing.length > 0) {
            return this.repo.setDefault(userId, created.id);
        }
        return created;
    }
}
