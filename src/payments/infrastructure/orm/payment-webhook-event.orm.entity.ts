import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

@Entity({ name: 'payment_webhook_events' })
@Unique('uq_pwe_provider_eventid', ['provider', 'providerEventId'])
export class PaymentWebhookEventOrmEntity extends BaseOrmEntity {
    @Column({ type: 'varchar', length: 40 })
    provider: string;

    @Column('varchar', { name: 'provider_event_id', length: 120, nullable: true })
    providerEventId: string | null;

    @Column('varchar', { name: 'event_type', length: 80 })
    eventType: string;

    @Column('varchar', { name: 'idempotency_key', length: 120, nullable: true })
    idempotencyKey: string | null;

    @Column('jsonb')
    payload: Record<string, any>;

    @Column('timestamptz', { name: 'processed_at', nullable: true })
    processedAt: Date | null;

    @Index()
    @Column({
        type: 'varchar',
        length: 30,
        name: 'processing_status',
        default: 'received',
    })
    processingStatus: string;
}
