import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import {
    AdminNotificationKind,
    AdminNotificationLevel,
} from '../../domain/types/admin-notification.types';

@Entity({ name: 'admin_notifications' })
export class AdminNotificationOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Index()
    @Column({ type: 'varchar', length: 10 })
    level: AdminNotificationLevel;

    @Index()
    @Column({ type: 'varchar', length: 40 })
    kind: AdminNotificationKind;

    @Column({ type: 'varchar', length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    body: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown> | null;

    @Index()
    @Column({ type: 'timestamptz', name: 'acknowledged_at', nullable: true })
    acknowledgedAt: Date | null;

    @Column({ type: 'uuid', name: 'acknowledged_by_user_id', nullable: true })
    acknowledgedByUserId: string | null;
}
