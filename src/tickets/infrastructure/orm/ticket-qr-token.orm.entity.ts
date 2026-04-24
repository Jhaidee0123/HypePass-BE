import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { QrTokenReason } from '../../domain/types/qr-token-reason';

@Entity({ name: 'ticket_qr_tokens' })
export class TicketQrTokenOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'ticket_id' })
    ticketId: string;

    @Column('varchar', { name: 'token_hash', length: 120 })
    tokenHash: string;

    @Column('integer', { name: 'token_version', default: 1 })
    tokenVersion: number;

    @Column('timestamptz', { name: 'valid_from' })
    validFrom: Date;

    @Column('timestamptz', { name: 'valid_until', nullable: true })
    validUntil: Date | null;

    @Index()
    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @Column({
        type: 'varchar',
        length: 30,
        name: 'generated_reason',
        default: QrTokenReason.ISSUE,
    })
    generatedReason: QrTokenReason;
}
