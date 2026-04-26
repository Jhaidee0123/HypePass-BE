import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'platform_settings' })
export class PlatformSettingOrmEntity {
    @PrimaryColumn({ type: 'varchar', length: 80 })
    key: string;

    @Column({ type: 'jsonb' })
    value: unknown;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 30 })
    type: string;

    @Column({ type: 'varchar', length: 30 })
    group: string;

    @Column({ name: 'updated_by_user_id', type: 'uuid', nullable: true })
    updatedByUserId: string | null;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
