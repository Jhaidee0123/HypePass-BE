import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { COMPANY_ROLES } from '../../../auth/constants';
import { AdminNotificationService } from '../../../admin-notifications/application/services/admin-notification.service';
import { CompanyEntity } from '../../domain/entities/company.entity';
import { CompanyMembershipEntity } from '../../domain/entities/company-membership.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { CompanyStatus } from '../../domain/types/company-status';
import { CreateCompanyDto } from '../dto/create-company.dto';

export class CreateCompanyUseCase {
    constructor(
        private readonly companyRepo: ICompanyRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
        private readonly adminNotifications: AdminNotificationService,
    ) {}

    async execute(
        dto: CreateCompanyDto,
        creatorUserId: string,
    ): Promise<CompanyEntity> {
        const existing = await this.companyRepo.findBySlug(dto.slug);
        if (existing) {
            throw new ConflictDomainException(
                `Slug "${dto.slug}" is already taken`,
                'COMPANY_SLUG_TAKEN',
            );
        }

        if (!creatorUserId) {
            throw new UnprocessableDomainException(
                'Authenticated user id is required to create a company',
            );
        }

        const company = new CompanyEntity({
            name: dto.name,
            slug: dto.slug,
            legalName: dto.legalName ?? null,
            taxId: dto.taxId ?? null,
            contactEmail: dto.contactEmail ?? null,
            logoUrl: dto.logoUrl ?? null,
            status: CompanyStatus.PENDING,
        });
        const saved = await this.companyRepo.create(company);

        const membership = new CompanyMembershipEntity({
            companyId: saved.id,
            userId: creatorUserId,
            role: COMPANY_ROLES.OWNER,
        });
        await this.membershipRepo.create(membership);

        void this.adminNotifications.record({
            kind: 'company.submitted',
            level: 'info',
            title: `Nueva compañía pendiente: ${saved.name}`,
            body: `@${saved.slug} envió KYC. Está esperando revisión.`,
            metadata: { companyId: saved.id, slug: saved.slug },
        });

        return saved;
    }
}
