import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderOrmEntity } from '../orm/order.orm.entity';

export class OrderMapper {
    static toDomain(orm: OrderOrmEntity): OrderEntity {
        return new OrderEntity({
            id: orm.id,
            userId: orm.userId,
            companyId: orm.companyId,
            type: orm.type,
            status: orm.status,
            currency: orm.currency,
            subtotal: orm.subtotal,
            serviceFeeTotal: orm.serviceFeeTotal,
            platformFeeTotal: orm.platformFeeTotal,
            taxTotal: orm.taxTotal,
            grandTotal: orm.grandTotal,
            paymentProvider: orm.paymentProvider,
            paymentReference: orm.paymentReference,
            reservedUntil: orm.reservedUntil,
            buyerFullName: orm.buyerFullName,
            buyerEmail: orm.buyerEmail,
            buyerPhone: orm.buyerPhone,
            buyerLegalId: orm.buyerLegalId,
            buyerLegalIdType: orm.buyerLegalIdType,
            needsReconciliation: orm.needsReconciliation ?? false,
            reconciliationReason: orm.reconciliationReason,
            promoterReferralCode: orm.promoterReferralCode ?? null,
            applicationFeeAmount: orm.applicationFeeAmount ?? null,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: OrderEntity): Partial<OrderOrmEntity> {
        return {
            id: entity.id,
            userId: entity.userId,
            companyId: entity.companyId ?? null,
            type: entity.type,
            status: entity.status,
            currency: entity.currency,
            subtotal: entity.subtotal,
            serviceFeeTotal: entity.serviceFeeTotal,
            platformFeeTotal: entity.platformFeeTotal,
            taxTotal: entity.taxTotal,
            grandTotal: entity.grandTotal,
            paymentProvider: entity.paymentProvider,
            paymentReference: entity.paymentReference,
            reservedUntil: entity.reservedUntil ?? null,
            buyerFullName: entity.buyerFullName,
            buyerEmail: entity.buyerEmail,
            buyerPhone: entity.buyerPhone ?? null,
            buyerLegalId: entity.buyerLegalId ?? null,
            buyerLegalIdType: entity.buyerLegalIdType ?? null,
            needsReconciliation: entity.needsReconciliation ?? false,
            reconciliationReason: entity.reconciliationReason ?? null,
            promoterReferralCode: entity.promoterReferralCode ?? null,
            applicationFeeAmount: entity.applicationFeeAmount ?? null,
        };
    }
}
