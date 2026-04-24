import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

@Entity({ name: 'user_consents' })
export class UserConsentOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Column({ type: 'varchar', length: 30, name: 'terms_version' })
    termsVersion: string;

    @Column({ type: 'varchar', length: 30, name: 'privacy_version' })
    privacyVersion: string;

    @Column({ type: 'varchar', length: 30 })
    source: string;

    @Column({ type: 'varchar', length: 64, name: 'ip_address', nullable: true })
    ipAddress: string | null;

    @Column({ type: 'varchar', length: 300, name: 'user_agent', nullable: true })
    userAgent: string | null;

    @Column('timestamptz', { name: 'accepted_at' })
    acceptedAt: Date;
}
