import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { ResaleOrderStatus } from '../../domain/types/resale-order-status';

@Entity({ name: 'resale_orders' })
export class ResaleOrderOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'resale_listing_id' })
    resaleListingId: string;

    @Index()
    @Column('text', { name: 'buyer_user_id' })
    buyerUserId: string;

    @Index({ unique: true })
    @Column('uuid', { name: 'order_id' })
    orderId: string;

    @Index()
    @Column({ type: 'varchar', length: 20, default: ResaleOrderStatus.PENDING })
    status: ResaleOrderStatus;
}
