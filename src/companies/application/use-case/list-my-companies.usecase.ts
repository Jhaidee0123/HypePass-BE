import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { CompanyStatus } from '../../domain/types/company-status';

export type MyCompanyView = {
    company: CompanyEntity;
    role: string;
};

export class ListMyCompaniesUseCase {
    constructor(
        private readonly companyRepo: ICompanyRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
    ) {}

    async execute(userId: string): Promise<MyCompanyView[]> {
        const memberships = await this.membershipRepo.findByUser(userId);
        const results: MyCompanyView[] = [];
        for (const m of memberships) {
            const company = await this.companyRepo.findById(m.companyId);
            if (!company) continue;
            // Hide soft-deleted companies from the organizer panel.
            // The admin panel can still see them via ListCompaniesUseCase.
            if (company.status === CompanyStatus.DELETED) continue;
            results.push({ company, role: m.role });
        }
        return results;
    }
}
