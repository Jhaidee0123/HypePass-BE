import { CompanyMembershipEntity } from '../../domain/entities/company-membership.entity';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';

export class ListMembersUseCase {
    constructor(private readonly repo: ICompanyMembershipRepository) {}

    execute(companyId: string): Promise<CompanyMembershipEntity[]> {
        return this.repo.findByCompany(companyId);
    }
}
