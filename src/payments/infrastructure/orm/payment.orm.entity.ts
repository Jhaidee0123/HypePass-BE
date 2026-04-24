import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { PaymentStatus } from '../../domain/types/payment-status';

@Entity({ name: 'payments' })
export class PaymentOrmEntity extends BaseOrmEntity {
    @Index({ unique: true })
    @Column('uuid', { name: 'order_id' })
    orderId: string;

    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Column('integer')
    amount: number;

    @Column({ type: 'varchar', length: 3, default: 'COP' })
    currency: string;

    @Index()
    @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ type: 'varchar', length: 40, default: 'wompi' })
    provider: string;

    @Index({ unique: true })
    @Column('varchar', { name: 'provider_reference', length: 120 })
    providerReference: string;

    @Column('varchar', {
        name: 'provider_transaction_id',
        length: 120,
        nullable: true,
    })
    providerTransactionId: string | null;

    @Column('jsonb', { name: 'raw_provider_payload', nullable: true })
    rawProviderPayload: Record<string, any> | null;
}
