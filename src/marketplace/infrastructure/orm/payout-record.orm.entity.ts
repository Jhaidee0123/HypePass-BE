import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import {
    PayoutRecordStatus,
    PayoutTransactionType,
} from '../../domain/types/payout-record-status';

@Entity({ name: 'payout_records' })
export class PayoutRecordOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'resale_listing_id', nullable: true })
    resaleListingId: string | null;

    @Index()
    @Column('text', { name: 'seller_user_id', nullable: true })
    sellerUserId: string | null;

    @Index()
    @Column('uuid', { name: 'company_id', nullable: true })
    companyId: string | null;

    @Column({
        type: 'varchar',
        length: 40,
        name: 'transaction_type',
    })
    transactionType: PayoutTransactionType;

    @Column('integer', { name: 'gross_amount' })
    grossAmount: number;

    @Column('integer', { name: 'platform_fee', default: 0 })
    platformFee: number;

    @Column('integer', { name: 'net_amount' })
    netAmount: number;

    @Column({ type: 'varchar', length: 3, default: 'COP' })
    currency: string;

    @Index()
    @Column({
        type: 'varchar',
        length: 20,
        default: PayoutRecordStatus.PENDING,
    })
    status: PayoutRecordStatus;

    @Index()
    @Column('uuid', { name: 'event_session_id', nullable: true })
    eventSessionId: string | null;

    @Index()
    @Column('timestamptz', { name: 'release_at', nullable: true })
    releaseAt: Date | null;

    @Column('timestamptz', { name: 'settled_at', nullable: true })
    settledAt: Date | null;

    @Column({
        type: 'varchar',
        length: 30,
        name: 'payout_account_type',
        nullable: true,
    })
    payoutAccountType: string | null;

    @Column({
        type: 'varchar',
        length: 80,
        name: 'payout_account_bank_name',
        nullable: true,
    })
    payoutAccountBankName: string | null;

    @Column({
        type: 'varchar',
        length: 40,
        name: 'payout_account_number',
        nullable: true,
    })
    payoutAccountNumber: string | null;

    @Column({
        type: 'varchar',
        length: 200,
        name: 'payout_account_holder_name',
        nullable: true,
    })
    payoutAccountHolderName: string | null;

    @Column({
        type: 'varchar',
        length: 10,
        name: 'payout_account_holder_legal_id_type',
        nullable: true,
    })
    payoutAccountHolderLegalIdType: string | null;

    @Column({
        type: 'varchar',
        length: 40,
        name: 'payout_account_holder_legal_id',
        nullable: true,
    })
    payoutAccountHolderLegalId: string | null;
}
