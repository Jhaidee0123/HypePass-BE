import { IBaseRepository } from '../../../shared/domain/repositories/base.repository';
import { CompanyEntity } from '../entities/company.entity';
import { CompanyQueryFilter } from '../types/company-query-filter';

export interface ICompanyRepository
    extends IBaseRepository<CompanyEntity, CompanyQueryFilter> {
    findBySlug(slug: string): Promise<CompanyEntity | null>;
}
