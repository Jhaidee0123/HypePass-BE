import { CompanyStatus } from './company-status';

export interface CompanyQueryFilter {
    status?: CompanyStatus;
    slug?: string;
    search?: string;
}
