import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { TicketStatus } from '../../domain/types/ticket-status';

@Entity({ name: 'tickets' })
export class TicketOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'order_item_id' })
    orderItemId: string;

    @Column('uuid', { name: 'original_order_id' })
    originalOrderId: string;

    @Index()
    @Column('text', { name: 'current_owner_user_id' })
    currentOwnerUserId: string;

    @Index()
    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Index()
    @Column('uuid', { name: 'event_session_id' })
    eventSessionId: string;

    @Index()
    @Column('uuid', { name: 'ticket_section_id' })
    ticketSectionId: string;

    @Column('uuid', { name: 'ticket_sale_phase_id', nullable: true })
    ticketSalePhaseId: string | null;

    @Index()
    @Column({ type: 'varchar', length: 30, default: TicketStatus.ISSUED })
    status: TicketStatus;

    @Column('integer', { name: 'ownership_version', default: 1 })
    ownershipVersion: number;

    @Column('integer', { name: 'face_value' })
    faceValue: number;

    @Column('integer', { name: 'latest_sale_price', nullable: true })
    latestSalePrice: number | null;

    @Column({ type: 'varchar', length: 3, default: 'COP' })
    currency: string;

    @Column('integer', { name: 'qr_generation_version', default: 1 })
    qrGenerationVersion: number;

    /**
     * Marks tickets issued as organizer-granted courtesies. Courtesy tickets
     * live in the owner's wallet, can be transferred, but cannot be listed
     * on the resale marketplace.
     */
    @Index()
    @Column('boolean', { default: false })
    courtesy: boolean;
}
