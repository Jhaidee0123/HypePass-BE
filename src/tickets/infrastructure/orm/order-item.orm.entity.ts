import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

@Entity({ name: 'order_items' })
export class OrderItemOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'order_id' })
    orderId: string;

    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Column('uuid', { name: 'event_session_id' })
    eventSessionId: string;

    @Column('uuid', { name: 'ticket_section_id' })
    ticketSectionId: string;

    @Column('uuid', { name: 'ticket_sale_phase_id', nullable: true })
    ticketSalePhaseId: string | null;

    @Column('integer')
    quantity: number;

    @Column('integer', { name: 'unit_price' })
    unitPrice: number;

    @Column('integer', { name: 'service_fee', default: 0 })
    serviceFee: number;

    @Column('integer', { name: 'platform_fee', default: 0 })
    platformFee: number;

    @Column('integer', { name: 'tax_amount', default: 0 })
    taxAmount: number;

    @Column('integer', { name: 'line_total' })
    lineTotal: number;
}
