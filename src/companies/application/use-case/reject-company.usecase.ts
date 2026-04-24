import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { CompanyStatus } from '../../domain/types/company-status';
import { ReviewCompanyDto } from '../dto/review-company.dto';
import { collectOwnerEmails } from './approve-company.usecase';

export class RejectCompanyUseCase {
    constructor(
        private readonly repo: ICompanyRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        adminUserId: string,
        dto: ReviewCompanyDto,
    ): Promise<CompanyEntity> {
        const current = await this.repo.findById(companyId);
        if (!current) throw new NotFoundDomainException('Company not found');

        const next = new CompanyEntity({
            id: current.id,
            createdAt: current.createdAt,
            name: current.name,
            slug: current.slug,
            legalName: current.legalName,
            taxId: current.taxId,
            contactEmail: current.contactEmail,
            logoUrl: current.logoUrl,
            status: CompanyStatus.REJECTED,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
            reviewNotes: dto.reviewNotes ?? current.reviewNotes,
            updatedAt: new Date(),
        });
        const saved = await this.repo.update(next);
        await this.audit.record({
            action: 'company.rejected',
            targetType: 'company',
            targetId: saved.id,
            actorUserId: adminUserId,
            metadata: { notes: dto.reviewNotes ?? null },
        });
        await this.notifyOwners(saved, dto.reviewNotes);
        return saved;
    }

    private async notifyOwners(company: CompanyEntity, notes?: string) {
        try {
            const recipients = await collectOwnerEmails(
                company,
                this.membershipRepo,
                this.userRepo,
            );
            if (recipients.length === 0) return;

            const body = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Revisión de compañía</h2>
<p style="margin:0 0 14px;color:#bfbab1;">La revisión de <strong style="color:#faf7f0;">${company.name}</strong> no resultó aprobada en este momento.</p>
${notes ? `<p style="margin:0 0 14px;color:#bfbab1;">Notas del revisor: <em>${notes}</em></p>` : ''}
<p style="margin:0 0 14px;color:#bfbab1;">Revisa las notas, ajusta lo necesario y vuelve a enviar. Estamos para ayudarte en <a href="mailto:support@hypepass.com" style="color:#d7ff3a;">support@hypepass.com</a>.</p>
`.trim();
            await this.email.send({
                to: recipients,
                subject: `HypePass — Revisión de "${company.name}"`,
                body,
            });
        } catch {
            /* logged inside EmailService */
        }
    }
}
