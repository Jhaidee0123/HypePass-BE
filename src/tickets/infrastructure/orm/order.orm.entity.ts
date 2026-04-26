import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { OrderStatus, OrderType } from '../../domain/types/order-status';

@Entity({ name: 'orders' })
export class OrderOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Index()
    @Column('uuid', { name: 'company_id', nullable: true })
    companyId: string | null;

    @Column({ type: 'varchar', length: 20, default: OrderType.PRIMARY })
    type: OrderType;

    @Index()
    @Column({ type: 'varchar', length: 30, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({ type: 'varchar', length: 3, default: 'COP' })
    currency: string;

    @Column('integer')
    subtotal: number;

    @Column('integer', { name: 'service_fee_total', default: 0 })
    serviceFeeTotal: number;

    @Column('integer', { name: 'platform_fee_total', default: 0 })
    platformFeeTotal: number;

    @Column('integer', { name: 'tax_total', default: 0 })
    taxTotal: number;

    @Column('integer', { name: 'grand_total' })
    grandTotal: number;

    @Column({ type: 'varchar', length: 40, name: 'payment_provider', default: 'wompi' })
    paymentProvider: string;

    @Index({ unique: true })
    @Column('varchar', { name: 'payment_reference', length: 80 })
    paymentReference: string;

    @Column('timestamptz', { name: 'reserved_until', nullable: true })
    reservedUntil: Date | null;

    @Column('varchar', { name: 'buyer_full_name', length: 200 })
    buyerFullName: string;

    @Column('varchar', { name: 'buyer_email', length: 200 })
    buyerEmail: string;

    @Column('varchar', { name: 'buyer_phone', length: 40, nullable: true })
    buyerPhone: string | null;

    @Column('varchar', { name: 'buyer_legal_id', length: 40, nullable: true })
    buyerLegalId: string | null;

    @Column('varchar', { name: 'buyer_legal_id_type', length: 10, nullable: true })
    buyerLegalIdType: string | null;

    @Index()
    @Column('boolean', { name: 'needs_reconciliation', default: false })
    needsReconciliation: boolean;

    @Column('varchar', {
        name: 'reconciliation_reason',
        length: 80,
        nullable: true,
    })
    reconciliationReason: string | null;

    @Index()
    @Column('varchar', {
        name: 'promoter_referral_code',
        length: 20,
        nullable: true,
    })
    promoterReferralCode: string | null;
}
