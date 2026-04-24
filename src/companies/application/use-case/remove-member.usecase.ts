import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { COMPANY_ROLES } from '../../../auth/constants';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';

export class RemoveMemberUseCase {
    constructor(private readonly repo: ICompanyMembershipRepository) {}

    async execute(companyId: string, membershipId: string): Promise<void> {
        const members = await this.repo.findByCompany(companyId);
        const target = members.find((m) => m.id === membershipId);
        if (!target) throw new NotFoundDomainException('Membership not found');
        if (target.role === COMPANY_ROLES.OWNER) {
            throw new ForbiddenDomainException(
                'Cannot remove the company owner',
                'CANNOT_REMOVE_OWNER',
            );
        }
        await this.repo.delete(membershipId);
    }
}
