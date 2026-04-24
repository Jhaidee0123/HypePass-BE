import { BaseProps } from '../../../shared/domain/types/base.props';
import { CompanyRole } from '../../../auth/constants';

export type CompanyMembershipProps = BaseProps & {
    companyId: string;
    userId: string;
    role: CompanyRole;
};
