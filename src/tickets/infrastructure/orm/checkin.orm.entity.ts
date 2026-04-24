import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import {
    CheckinRejectionReason,
    CheckinResult,
} from '../../domain/types/checkin-rejection-reason';

@Entity({ name: 'checkins' })
export class CheckinOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'ticket_id', nullable: true })
    ticketId: string | null;

    @Index()
    @Column('uuid', { name: 'event_session_id', nullable: true })
    eventSessionId: string | null;

    @Column('text', { name: 'scanned_by_user_id', nullable: true })
    scannedByUserId: string | null;

    @Column('varchar', { name: 'scanner_device_id', length: 80, nullable: true })
    scannerDeviceId: string | null;

    @Index()
    @Column({ type: 'varchar', length: 20 })
    result: CheckinResult;

    @Column({
        type: 'varchar',
        length: 40,
        name: 'rejection_reason',
        nullable: true,
    })
    rejectionReason: CheckinRejectionReason | null;

    @Column('timestamptz', { name: 'scanned_at' })
    scannedAt: Date;
}
