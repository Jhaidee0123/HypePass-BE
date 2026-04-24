import {
    ForbiddenDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { PayoutMethodEntity } from '../../domain/entities/payout-method.entity';
import { IPayoutMethodRepository } from '../../domain/repositories/payout-method.repository';
import { PayoutMethodType } from '../../domain/types/payout-method-type';
import { UpdatePayoutMethodDto } from '../dto/update-payout-method.dto';

export class UpdatePayoutMethodUseCase {
    constructor(private readonly repo: IPayoutMethodRepository) {}

    async execute(
        userId: string,
        payoutMethodId: string,
        dto: UpdatePayoutMethodDto,
    ): Promise<PayoutMethodEntity> {
        const current = await this.repo.findById(payoutMethodId);
        if (!current)
            throw new NotFoundDomainException('Payout method not found');
        if (current.userId !== userId) {
            throw new ForbiddenDomainException('Not your payout method');
        }

        const nextType = dto.type ?? current.type;
        const nextBankName =
            dto.bankName !== undefined ? dto.bankName : current.bankName;
        if (
            nextType === PayoutMethodType.OTHER_BANK &&
            !(nextBankName && nextBankName.trim())
        ) {
            throw new UnprocessableDomainException(
                'bankName is required when type is OTHER_BANK',
                'BANK_NAME_REQUIRED',
            );
        }

        const updated = await this.repo.update(
            new PayoutMethodEntity({
                ...current,
                id: current.id,
                createdAt: current.createdAt,
                type: nextType,
                bankName: nextBankName ?? null,
                accountNumber: dto.accountNumber ?? current.accountNumber,
                holderName: dto.holderName ?? current.holderName,
                holderLegalIdType:
                    dto.holderLegalIdType ?? current.holderLegalIdType,
                holderLegalId: dto.holderLegalId ?? current.holderLegalId,
                isDefault: current.isDefault,
                verifiedAt: current.verifiedAt,
                updatedAt: new Date(),
            } as any),
        );

        if (dto.makeDefault === true && !updated.isDefault) {
            return this.repo.setDefault(userId, updated.id);
        }
        return updated;
    }
}
