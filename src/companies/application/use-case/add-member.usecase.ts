import {
    ConflictDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { CompanyMembershipEntity } from '../../domain/entities/company-membership.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { AddMemberDto } from '../dto/add-member.dto';

export class AddMemberUseCase {
    constructor(
        private readonly companyRepo: ICompanyRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(
        companyId: string,
        dto: AddMemberDto,
    ): Promise<CompanyMembershipEntity> {
        const company = await this.companyRepo.findById(companyId);
        if (!company) throw new NotFoundDomainException('Company not found');

        const user = await this.userRepo.findByEmail(dto.email);
        if (!user) {
            throw new NotFoundDomainException(
                'No registered user with that email',
                'USER_NOT_REGISTERED',
            );
        }

        const existing = await this.membershipRepo.findOne(companyId, user.id);
        if (existing) {
            throw new ConflictDomainException(
                'User is already a member of this company',
                'MEMBERSHIP_EXISTS',
            );
        }

        const membership = new CompanyMembershipEntity({
            companyId,
            userId: user.id,
            role: dto.role,
        });
        return this.membershipRepo.create(membership);
    }
}
