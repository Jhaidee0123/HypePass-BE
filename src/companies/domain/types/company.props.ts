import { BaseProps } from '../../../shared/domain/types/base.props';
import { CompanyStatus } from './company-status';

export type CompanyProps = BaseProps & {
    name: string;
    slug: string;
    legalName?: string | null;
    taxId?: string | null;
    contactEmail?: string | null;
    logoUrl?: string | null;
    status: CompanyStatus;
    reviewedByUserId?: string | null;
    reviewedAt?: Date | null;
    reviewNotes?: string | null;
};
