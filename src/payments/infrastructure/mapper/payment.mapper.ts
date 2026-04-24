import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentOrmEntity } from '../orm/payment.orm.entity';

export class PaymentMapper {
    static toDomain(orm: PaymentOrmEntity): PaymentEntity {
        return new PaymentEntity({
            id: orm.id,
            orderId: orm.orderId,
            userId: orm.userId,
            amount: orm.amount,
            currency: orm.currency,
            status: orm.status,
            provider: orm.provider,
            providerReference: orm.providerReference,
            providerTransactionId: orm.providerTransactionId,
            rawProviderPayload: orm.rawProviderPayload,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: PaymentEntity): Partial<PaymentOrmEntity> {
        return {
            id: entity.id,
            orderId: entity.orderId,
            userId: entity.userId,
            amount: entity.amount,
            currency: entity.currency,
            status: entity.status,
            provider: entity.provider,
            providerReference: entity.providerReference,
            providerTransactionId: entity.providerTransactionId ?? null,
            rawProviderPayload:
                (entity.rawProviderPayload as Record<string, any> | null) ??
                null,
        };
    }
}
