import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyStatus } from '../../domain/types/company-status';

export class SuspendCompanyUseCase {
    constructor(
        private readonly repo: ICompanyRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        adminUserId: string,
        reason: string,
    ): Promise<CompanyEntity> {
        if (reason.trim().length < 5) {
            throw new UnprocessableDomainException(
                'reason must be at least 5 characters',
            );
        }
        const current = await this.repo.findById(companyId);
        if (!current) throw new NotFoundDomainException('Company not found');
        if (current.status === CompanyStatus.SUSPENDED) {
            throw new UnprocessableDomainException(
                'Company is already suspended',
            );
        }

        const next = new CompanyEntity({
            id: current.id,
            createdAt: current.createdAt,
            name: current.name,
            slug: current.slug,
            legalName: current.legalName,
            taxId: current.taxId,
            contactEmail: current.contactEmail,
            logoUrl: current.logoUrl,
            status: CompanyStatus.SUSPENDED,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
            reviewNotes: reason.trim(),
            updatedAt: new Date(),
        });
        const saved = await this.repo.update(next);

        void this.audit.record({
            action: 'company.suspended',
            actorUserId: adminUserId,
            targetType: 'company',
            targetId: saved.id,
            metadata: { reason: reason.trim(), previousStatus: current.status },
        });
        return saved;
    }
}

export class ReinstateCompanyUseCase {
    constructor(
        private readonly repo: ICompanyRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        adminUserId: string,
    ): Promise<CompanyEntity> {
        const current = await this.repo.findById(companyId);
        if (!current) throw new NotFoundDomainException('Company not found');
        if (current.status !== CompanyStatus.SUSPENDED) {
            throw new UnprocessableDomainException(
                'Only suspended companies can be reinstated',
            );
        }

        const next = new CompanyEntity({
            id: current.id,
            createdAt: current.createdAt,
            name: current.name,
            slug: current.slug,
            legalName: current.legalName,
            taxId: current.taxId,
            contactEmail: current.contactEmail,
            logoUrl: current.logoUrl,
            status: CompanyStatus.ACTIVE,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
            reviewNotes: null,
            updatedAt: new Date(),
        });
        const saved = await this.repo.update(next);

        void this.audit.record({
            action: 'company.reinstated',
            actorUserId: adminUserId,
            targetType: 'company',
            targetId: saved.id,
            metadata: null,
        });
        return saved;
    }
}
