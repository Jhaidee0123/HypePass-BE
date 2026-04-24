import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { CompanyRole } from '../../../auth/constants';
import { CompanyMembershipProps } from '../types/company-membership.props';

export class CompanyMembershipEntity extends BaseEntity {
    readonly companyId: string;
    readonly userId: string;
    readonly role: CompanyRole;

    constructor(props: CompanyMembershipProps) {
        super(props);
        this.companyId = props.companyId;
        this.userId = props.userId;
        this.role = props.role;
    }
}
