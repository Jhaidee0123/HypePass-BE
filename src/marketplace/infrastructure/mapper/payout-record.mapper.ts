import { PayoutRecordEntity } from '../../domain/entities/payout-record.entity';
import { PayoutRecordOrmEntity } from '../orm/payout-record.orm.entity';

export class PayoutRecordMapper {
    static toDomain(orm: PayoutRecordOrmEntity): PayoutRecordEntity {
        return new PayoutRecordEntity({
            id: orm.id,
            resaleListingId: orm.resaleListingId,
            sellerUserId: orm.sellerUserId,
            companyId: orm.companyId,
            eventSessionId: orm.eventSessionId,
            transactionType: orm.transactionType,
            grossAmount: orm.grossAmount,
            platformFee: orm.platformFee,
            netAmount: orm.netAmount,
            currency: orm.currency,
            status: orm.status,
            releaseAt: orm.releaseAt,
            settledAt: orm.settledAt,
            payoutAccountType: orm.payoutAccountType,
            payoutAccountBankName: orm.payoutAccountBankName,
            payoutAccountNumber: orm.payoutAccountNumber,
            payoutAccountHolderName: orm.payoutAccountHolderName,
            payoutAccountHolderLegalIdType: orm.payoutAccountHolderLegalIdType,
            payoutAccountHolderLegalId: orm.payoutAccountHolderLegalId,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: PayoutRecordEntity,
    ): Partial<PayoutRecordOrmEntity> {
        return {
            id: entity.id,
            resaleListingId: entity.resaleListingId ?? null,
            sellerUserId: entity.sellerUserId ?? null,
            companyId: entity.companyId ?? null,
            eventSessionId: entity.eventSessionId ?? null,
            transactionType: entity.transactionType,
            grossAmount: entity.grossAmount,
            platformFee: entity.platformFee,
            netAmount: entity.netAmount,
            currency: entity.currency,
            status: entity.status,
            releaseAt: entity.releaseAt ?? null,
            settledAt: entity.settledAt ?? null,
            payoutAccountType: entity.payoutAccountType ?? null,
            payoutAccountBankName: entity.payoutAccountBankName ?? null,
            payoutAccountNumber: entity.payoutAccountNumber ?? null,
            payoutAccountHolderName: entity.payoutAccountHolderName ?? null,
            payoutAccountHolderLegalIdType:
                entity.payoutAccountHolderLegalIdType ?? null,
            payoutAccountHolderLegalId:
                entity.payoutAccountHolderLegalId ?? null,
        };
    }
}
