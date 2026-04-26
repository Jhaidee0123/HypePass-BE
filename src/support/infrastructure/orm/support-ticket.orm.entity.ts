import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import {
    SupportTicketKind,
    SupportTicketStatus,
} from '../../domain/types/support.types';

@Entity({ name: 'support_tickets' })
export class SupportTicketOrmEntity extends BaseOrmEntity {
    @Index()
    @Column({ type: 'varchar', length: 20 })
    kind: SupportTicketKind;

    @Index()
    @Column({ type: 'varchar', length: 20, default: 'open' })
    status: SupportTicketStatus;

    @Column({ type: 'varchar', length: 200 })
    subject: string;

    @Column({ type: 'text' })
    body: string;

    @Index()
    @Column('text', { name: 'user_id', nullable: true })
    userId: string | null;

    @Column('varchar', { name: 'guest_email', length: 200, nullable: true })
    guestEmail: string | null;

    @Index()
    @Column('uuid', { name: 'related_order_id', nullable: true })
    relatedOrderId: string | null;

    @Index()
    @Column('uuid', { name: 'related_company_id', nullable: true })
    relatedCompanyId: string | null;

    @Index()
    @Column('uuid', { name: 'related_event_id', nullable: true })
    relatedEventId: string | null;

    @Column({ type: 'text', name: 'attachments', array: true, nullable: true })
    attachments: string[] | null;

    @Column('uuid', { name: 'assigned_to_user_id', nullable: true })
    assignedToUserId: string | null;

    @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
    resolvedAt: Date | null;
}
