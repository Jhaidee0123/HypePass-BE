import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { CompanyRole } from '../../../auth/constants';

@Entity({ name: 'company_memberships' })
@Unique('uq_company_user', ['companyId', 'userId'])
export class CompanyMembershipOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'company_id' })
    companyId: string;

    @Index()
    @Column('text', { name: 'user_id' })
    userId: string;

    @Column('varchar', { length: 30 })
    role: CompanyRole;
}
