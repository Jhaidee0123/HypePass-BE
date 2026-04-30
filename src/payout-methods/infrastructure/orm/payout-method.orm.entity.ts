import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { PayoutMethodType } from '../../domain/types/payout-method-type';

@Entity({ name: 'user_payout_methods' })
@Unique('uq_payout_method_user_type_number', [
    'userId',
    'type',
    'accountNumber',
])
export class PayoutMethodOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Column({ type: 'varchar', length: 30 })
    type: PayoutMethodType;

    @Column({ type: 'varchar', length: 80, name: 'bank_name', nullable: true })
    bankName: string | null;

    @Column({ type: 'varchar', length: 40, name: 'account_number' })
    accountNumber: string;

    @Column({ type: 'varchar', length: 200, name: 'holder_name' })
    holderName: string;

    @Column({ type: 'varchar', length: 10, name: 'holder_legal_id_type' })
    holderLegalIdType: string;

    @Column({ type: 'varchar', length: 40, name: 'holder_legal_id' })
    holderLegalId: string;

    @Index()
    @Column('boolean', { name: 'is_default', default: false })
    isDefault: boolean;

    @Column('timestamptz', { name: 'verified_at', nullable: true })
    verifiedAt: Date | null;

    @Column({
        type: 'varchar',
        length: 80,
        name: 'wompi_bank_id',
        nullable: true,
    })
    wompiBankId: string | null;

    @Column({
        type: 'varchar',
        length: 10,
        name: 'account_type',
        nullable: true,
    })
    accountType: 'AHORROS' | 'CORRIENTE' | null;
}
