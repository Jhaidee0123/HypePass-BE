import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { TicketSectionStatus } from '../../domain/types/ticket-section-status';

@Entity({ name: 'ticket_sections' })
export class TicketSectionOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'event_session_id' })
    eventSessionId: string;

    @Column('varchar', { length: 120 })
    name: string;

    @Column('text', { nullable: true })
    description: string | null;

    @Column('integer', { name: 'total_inventory' })
    totalInventory: number;

    @Column('integer', { name: 'min_per_order', default: 1 })
    minPerOrder: number;

    @Column('integer', { name: 'max_per_order', default: 8 })
    maxPerOrder: number;

    @Column('boolean', { name: 'resale_allowed', default: true })
    resaleAllowed: boolean;

    @Column('boolean', { name: 'transfer_allowed', default: true })
    transferAllowed: boolean;

    @Column({
        type: 'varchar',
        length: 30,
        default: TicketSectionStatus.ACTIVE,
    })
    status: TicketSectionStatus;

    @Column('integer', { name: 'sort_order', default: 0 })
    sortOrder: number;
}
