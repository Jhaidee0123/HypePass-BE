import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { CompanyStatus } from '../../domain/types/company-status';

@Entity({ name: 'companies' })
export class CompanyOrmEntity extends BaseOrmEntity {
    @Column('varchar', { length: 160 })
    name: string;

    @Index({ unique: true })
    @Column('varchar', { length: 160 })
    slug: string;

    @Column('varchar', { name: 'legal_name', length: 200, nullable: true })
    legalName: string | null;

    @Column('varchar', { name: 'tax_id', length: 40, nullable: true })
    taxId: string | null;

    @Column('varchar', { name: 'contact_email', length: 200, nullable: true })
    contactEmail: string | null;

    @Column('varchar', { name: 'logo_url', length: 500, nullable: true })
    logoUrl: string | null;

    @Index()
    @Column({
        type: 'varchar',
        length: 20,
        default: CompanyStatus.PENDING,
    })
    status: CompanyStatus;

    @Column('text', { name: 'reviewed_by_user_id', nullable: true })
    reviewedByUserId: string | null;

    @Column('timestamptz', { name: 'reviewed_at', nullable: true })
    reviewedAt: Date | null;

    @Column('text', { name: 'review_notes', nullable: true })
    reviewNotes: string | null;
}
