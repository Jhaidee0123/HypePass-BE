import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { COMPANY_ROLES } from '../../../auth/constants';
import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { CompanyStatus } from '../../domain/types/company-status';
import { ReviewCompanyDto } from '../dto/review-company.dto';

export class ApproveCompanyUseCase {
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

        if (current.status === CompanyStatus.ACTIVE) {
            throw new UnprocessableDomainException(
                'Company is already active',
                'COMPANY_ALREADY_ACTIVE',
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
            reviewNotes: dto.reviewNotes ?? current.reviewNotes,
            updatedAt: new Date(),
        });
        const saved = await this.repo.update(next);

        await this.audit.record({
            action: 'company.approved',
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
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Tu compañía fue aprobada</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Buenas noticias — <strong style="color:#faf7f0;">${company.name}</strong> pasó la revisión y ya puede crear eventos en HypePass.</p>
${notes ? `<p style="margin:0 0 14px;color:#bfbab1;">Notas del revisor: <em>${notes}</em></p>` : ''}
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/organizer" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ir al panel</a></p>
`.trim();
            await this.email.send({
                to: recipients,
                subject: `HypePass — "${company.name}" aprobada`,
                body,
            });
        } catch {
            /* logged inside EmailService */
        }
    }
}

export async function collectOwnerEmails(
    company: CompanyEntity,
    membershipRepo: ICompanyMembershipRepository,
    userRepo: IUserRepository,
): Promise<string[]> {
    const members = await membershipRepo.findByCompany(company.id);
    const owners = members.filter((m) => m.role === COMPANY_ROLES.OWNER);
    const recipients: string[] = [];
    for (const m of owners) {
        const user = await userRepo.findById(m.userId);
        if (user?.email) recipients.push(user.email);
    }
    if (company.contactEmail) recipients.push(company.contactEmail);
    return Array.from(new Set(recipients));
}
