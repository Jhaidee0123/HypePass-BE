import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Lightweight homegrown analytics. One row per FE page view (beacon).
 * No PII beyond user_id (which is optional). IP truncated to /24 for privacy.
 */
@Entity({ name: 'page_views' })
export class PageViewOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Index()
    @Column({ type: 'varchar', length: 200 })
    path: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    referrer: string | null;

    @Index()
    @Column({ type: 'varchar', length: 80, name: 'session_id' })
    sessionId: string;

    @Index()
    @Column({ type: 'text', name: 'user_id', nullable: true })
    userId: string | null;

    @Column({ type: 'varchar', length: 30, name: 'ip_class', nullable: true })
    ipClass: string | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    userAgent: string | null;

    @Column({ type: 'varchar', length: 8, nullable: true })
    locale: string | null;

    @Column({ type: 'varchar', length: 30, nullable: true })
    device: string | null;
}
