import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyQueryFilter } from '../../domain/types/company-query-filter';

export class ListCompaniesUseCase {
    constructor(private readonly repo: ICompanyRepository) {}

    execute(query?: CompanyQueryFilter): Promise<CompanyEntity[]> {
        return this.repo.findAll(query);
    }
}
