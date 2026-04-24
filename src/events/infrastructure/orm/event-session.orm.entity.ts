import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { EventSessionStatus } from '../../domain/types/event-session-status';

@Entity({ name: 'event_sessions' })
export class EventSessionOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Column('varchar', { length: 120, nullable: true })
    name: string | null;

    @Index()
    @Column('timestamptz', { name: 'starts_at' })
    startsAt: Date;

    @Column('timestamptz', { name: 'ends_at' })
    endsAt: Date;

    @Column('varchar', { length: 60, default: 'America/Bogota' })
    timezone: string;

    @Column('timestamptz', { name: 'sales_start_at', nullable: true })
    salesStartAt: Date | null;

    @Column('timestamptz', { name: 'sales_end_at', nullable: true })
    salesEndAt: Date | null;

    @Column('timestamptz', { name: 'doors_open_at', nullable: true })
    doorsOpenAt: Date | null;

    @Column('timestamptz', { name: 'checkin_start_at', nullable: true })
    checkinStartAt: Date | null;

    @Column('timestamptz', { name: 'transfer_cutoff_at', nullable: true })
    transferCutoffAt: Date | null;

    @Column('timestamptz', { name: 'resale_cutoff_at', nullable: true })
    resaleCutoffAt: Date | null;

    @Column('timestamptz', { name: 'qr_visible_from', nullable: true })
    qrVisibleFrom: Date | null;

    @Column({
        type: 'varchar',
        length: 30,
        default: EventSessionStatus.SCHEDULED,
    })
    status: EventSessionStatus;
}
