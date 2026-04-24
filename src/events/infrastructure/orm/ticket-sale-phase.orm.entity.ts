import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

@Entity({ name: 'ticket_sale_phases' })
export class TicketSalePhaseOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'ticket_section_id' })
    ticketSectionId: string;

    @Column('varchar', { length: 120 })
    name: string;

    @Column('timestamptz', { name: 'starts_at' })
    startsAt: Date;

    @Column('timestamptz', { name: 'ends_at' })
    endsAt: Date;

    /** Price in minor units (COP cents). */
    @Column('integer')
    price: number;

    @Column('varchar', { length: 3, default: 'COP' })
    currency: string;

    @Column('integer', { name: 'service_fee', nullable: true })
    serviceFee: number | null;

    @Column('integer', { name: 'platform_fee', nullable: true })
    platformFee: number | null;

    @Column('integer', { name: 'tax_amount', nullable: true })
    taxAmount: number | null;

    @Column('integer', { name: 'max_per_order', nullable: true })
    maxPerOrder: number | null;

    @Column('integer', { name: 'max_per_user', nullable: true })
    maxPerUser: number | null;

    @Column('integer', { name: 'sort_order', default: 0 })
    sortOrder: number;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;
}
