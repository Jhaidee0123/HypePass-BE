import { PayoutMethodEntity } from '../../domain/entities/payout-method.entity';
import { PayoutMethodOrmEntity } from '../orm/payout-method.orm.entity';

export class PayoutMethodMapper {
    static toDomain(orm: PayoutMethodOrmEntity): PayoutMethodEntity {
        return new PayoutMethodEntity({
            id: orm.id,
            userId: orm.userId,
            type: orm.type,
            bankName: orm.bankName,
            accountNumber: orm.accountNumber,
            holderName: orm.holderName,
            holderLegalIdType: orm.holderLegalIdType,
            holderLegalId: orm.holderLegalId,
            isDefault: orm.isDefault,
            verifiedAt: orm.verifiedAt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: PayoutMethodEntity,
    ): Partial<PayoutMethodOrmEntity> {
        return {
            id: entity.id,
            userId: entity.userId,
            type: entity.type,
            bankName: entity.bankName ?? null,
            accountNumber: entity.accountNumber,
            holderName: entity.holderName,
            holderLegalIdType: entity.holderLegalIdType,
            holderLegalId: entity.holderLegalId,
            isDefault: entity.isDefault,
            verifiedAt: entity.verifiedAt ?? null,
        };
    }
}
