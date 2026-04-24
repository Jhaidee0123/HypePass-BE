import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { TicketTransferStatus } from '../../domain/types/ticket-transfer-status';

@Entity({ name: 'ticket_transfers' })
export class TicketTransferOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'ticket_id' })
    ticketId: string;

    @Index()
    @Column('text', { name: 'from_user_id' })
    fromUserId: string;

    @Index()
    @Column('text', { name: 'to_user_id' })
    toUserId: string;

    @Index()
    @Column({
        type: 'varchar',
        length: 20,
        default: TicketTransferStatus.PENDING,
    })
    status: TicketTransferStatus;

    @Column('text', { nullable: true })
    note: string | null;

    @Column('timestamptz', { name: 'initiated_at' })
    initiatedAt: Date;

    @Column('timestamptz', { name: 'completed_at', nullable: true })
    completedAt: Date | null;

    @Column('timestamptz', { name: 'expires_at', nullable: true })
    expiresAt: Date | null;

    @Column('integer', {
        name: 'resulting_ownership_version',
        nullable: true,
    })
    resultingOwnershipVersion: number | null;

    @Column('integer', {
        name: 'resulting_qr_generation_version',
        nullable: true,
    })
    resultingQrGenerationVersion: number | null;
}
