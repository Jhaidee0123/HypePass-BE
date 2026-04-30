import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyStatus } from '../../domain/types/company-status';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';

/**
 * Soft-deletes a company. Platform-admin only. Marks status = DELETED so
 * the row stays around for referential integrity (orders, payouts, audit
 * trail) but disappears from every listing.
 *
 * Refuses if any of the company's events still has issued tickets — that
 * would orphan financial records. Admin must refund / cancel orders for
 * the affected events first.
 */
export class DeleteCompanyUseCase {
    constructor(
        private readonly repo: ICompanyRepository,
        private readonly events: IEventRepository,
        private readonly tickets: ITicketRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        companyId: string,
        adminUserId: string,
    ): Promise<CompanyEntity> {
        const current = await this.repo.findById(companyId);
        if (!current) throw new NotFoundDomainException('Company not found');
        if (current.status === CompanyStatus.DELETED) {
            throw new UnprocessableDomainException(
                'Company is already deleted',
            );
        }

        // Block if any event of this company has tickets. We aggregate
        // counts across every event the company owns.
        const companyEvents = await this.events.findAll({ companyId });
        let totalTickets = 0;
        for (const e of companyEvents) {
            totalTickets += await this.tickets.countByEvent(e.id);
            if (totalTickets > 0) break;
        }
        if (totalTickets > 0) {
            throw new UnprocessableDomainException(
                'Cannot delete company: one or more of its events still has issued tickets. Refund/cancel orders first.',
                'COMPANY_HAS_TICKETS',
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
            status: CompanyStatus.DELETED,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
            reviewNotes: 'Deleted by platform admin',
            updatedAt: new Date(),
        });
        const saved = await this.repo.update(next);

        void this.audit
            .record({
                actorKind: 'user',
                actorUserId: adminUserId,
                action: 'company.deleted',
                targetType: 'company',
                targetId: saved.id,
                metadata: {
                    name: current.name,
                    slug: current.slug,
                    previousStatus: current.status,
                    eventCount: companyEvents.length,
                },
            })
            .catch(() => undefined);

        return saved;
    }
}
