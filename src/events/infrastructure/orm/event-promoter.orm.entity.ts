import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

/**
 * Per-event promoter assignment. The organizer adds promoters to an event;
 * each promoter gets a unique referral code. When a buyer hits checkout
 * carrying that code, the order's `promoter_referral_code` is stamped with
 * it for tracking (no money flow inside HypePass).
 *
 * Soft-deleted via `revoked_at` so historical attribution survives revoke.
 *
 * Two partial unique indexes (created via @nestjs migration when ready):
 *   UNIQUE (event_id, user_id) WHERE revoked_at IS NULL
 *   UNIQUE (event_id, referral_code) WHERE revoked_at IS NULL
 */
@Entity({ name: 'event_promoters' })
export class EventPromoterOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Index()
    @Column('varchar', { length: 20, name: 'referral_code' })
    referralCode: string;

    @Column('text', { name: 'assigned_by_user_id' })
    assignedByUserId: string;

    @Column('varchar', { length: 200, nullable: true })
    note: string | null;

    @Index()
    @Column('timestamptz', { name: 'revoked_at', nullable: true })
    revokedAt: Date | null;
}
