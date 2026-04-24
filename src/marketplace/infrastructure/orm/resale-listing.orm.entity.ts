import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';

@Entity({ name: 'resale_listings' })
export class ResaleListingOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'ticket_id' })
    ticketId: string;

    @Index()
    @Column('text', { name: 'seller_user_id' })
    sellerUserId: string;

    @Column('integer', { name: 'ask_price' })
    askPrice: number;

    @Column('integer', { name: 'platform_fee_amount', default: 0 })
    platformFeeAmount: number;

    @Column('integer', { name: 'seller_net_amount', default: 0 })
    sellerNetAmount: number;

    @Column({ type: 'varchar', length: 3, default: 'COP' })
    currency: string;

    @Index()
    @Column({ type: 'varchar', length: 20, default: ResaleListingStatus.ACTIVE })
    status: ResaleListingStatus;

    @Column('varchar', { name: 'note', length: 500, nullable: true })
    note: string | null;

    @Column('text', { name: 'reserved_by_user_id', nullable: true })
    reservedByUserId: string | null;

    @Column('timestamptz', { name: 'reserved_until', nullable: true })
    reservedUntil: Date | null;

    @Column('timestamptz', { name: 'expires_at', nullable: true })
    expiresAt: Date | null;

    @Column('timestamptz', { name: 'cancelled_at', nullable: true })
    cancelledAt: Date | null;

    @Column('timestamptz', { name: 'sold_at', nullable: true })
    soldAt: Date | null;
}
