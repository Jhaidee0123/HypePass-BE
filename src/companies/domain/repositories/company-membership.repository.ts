import { CompanyMembershipEntity } from '../entities/company-membership.entity';

export interface ICompanyMembershipRepository {
    findByUser(userId: string): Promise<CompanyMembershipEntity[]>;
    findByCompany(companyId: string): Promise<CompanyMembershipEntity[]>;
    findOne(
        companyId: string,
        userId: string,
    ): Promise<CompanyMembershipEntity | null>;
    create(entity: CompanyMembershipEntity): Promise<CompanyMembershipEntity>;
    delete(id: string): Promise<void>;
}
