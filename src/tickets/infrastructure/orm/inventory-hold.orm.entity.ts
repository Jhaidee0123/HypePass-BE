import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { InventoryHoldStatus } from '../../domain/types/inventory-hold-status';

@Entity({ name: 'inventory_holds' })
export class InventoryHoldOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Index()
    @Column('uuid', { name: 'event_session_id' })
    eventSessionId: string;

    @Index()
    @Column('uuid', { name: 'ticket_section_id' })
    ticketSectionId: string;

    @Column('uuid', { name: 'ticket_sale_phase_id' })
    ticketSalePhaseId: string;

    @Column('integer')
    quantity: number;

    @Index()
    @Column({ type: 'varchar', length: 20, default: InventoryHoldStatus.ACTIVE })
    status: InventoryHoldStatus;

    @Index()
    @Column('timestamptz', { name: 'expires_at' })
    expiresAt: Date;

    @Column('uuid', { name: 'order_id', nullable: true })
    orderId: string | null;
}
