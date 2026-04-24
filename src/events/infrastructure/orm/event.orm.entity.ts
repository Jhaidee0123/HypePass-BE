import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { EventStatus } from '../../domain/types/event-status';

@Entity({ name: 'events' })
export class EventOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'company_id' })
    companyId: string;

    @Index()
    @Column('uuid', { name: 'category_id', nullable: true })
    categoryId: string | null;

    @Index()
    @Column('uuid', { name: 'venue_id', nullable: true })
    venueId: string | null;

    @Column('varchar', { length: 220 })
    title: string;

    @Index({ unique: true })
    @Column('varchar', { length: 220 })
    slug: string;

    @Column('varchar', { name: 'short_description', length: 500, nullable: true })
    shortDescription: string | null;

    @Column('text', { nullable: true })
    description: string | null;

    @Column('varchar', { name: 'cover_image_url', length: 500, nullable: true })
    coverImageUrl: string | null;

    @Column('varchar', { name: 'banner_image_url', length: 500, nullable: true })
    bannerImageUrl: string | null;

    @Index()
    @Column({ type: 'varchar', length: 30, default: EventStatus.DRAFT })
    status: EventStatus;

    @Column('timestamptz', { name: 'publication_submitted_at', nullable: true })
    publicationSubmittedAt: Date | null;

    @Column('timestamptz', { name: 'publication_approved_at', nullable: true })
    publicationApprovedAt: Date | null;

    @Column('timestamptz', { name: 'publication_rejected_at', nullable: true })
    publicationRejectedAt: Date | null;

    @Column('text', { name: 'publication_reviewed_by', nullable: true })
    publicationReviewedBy: string | null;

    @Column('boolean', { name: 'resale_enabled', default: true })
    resaleEnabled: boolean;

    @Column('boolean', { name: 'transfer_enabled', default: true })
    transferEnabled: boolean;

    @Column('integer', {
        name: 'default_qr_visible_hours_before',
        nullable: true,
    })
    defaultQrVisibleHoursBefore: number | null;

    @Column('varchar', { length: 3, default: 'COP' })
    currency: string;

    @Column('numeric', {
        name: 'resale_price_cap_multiplier',
        precision: 4,
        scale: 2,
        nullable: true,
        transformer: {
            to: (v: number | null | undefined) => (v == null ? null : v),
            from: (v: string | null) => (v == null ? null : Number(v)),
        },
    })
    resalePriceCapMultiplier: number | null;

    @Column('numeric', {
        name: 'resale_fee_pct',
        precision: 5,
        scale: 2,
        nullable: true,
        transformer: {
            to: (v: number | null | undefined) => (v == null ? null : v),
            from: (v: string | null) => (v == null ? null : Number(v)),
        },
    })
    resaleFeePct: number | null;

    @Column('integer', {
        name: 'max_tickets_per_user_per_session',
        nullable: true,
    })
    maxTicketsPerUserPerSession: number | null;
}
