import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../../shared/infrastructure/services/email.service';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';
import { ICompanyRepository } from '../../../../companies/domain/repositories/company.repository';
import { ICompanyMembershipRepository } from '../../../../companies/domain/repositories/company-membership.repository';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository';
import { COMPANY_ROLES } from '../../../../auth/constants';
import { EventEntity } from '../../../domain/entities/event.entity';
import { EventPublicationReviewEntity } from '../../../domain/entities/event-publication-review.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IEventPublicationReviewRepository } from '../../../domain/repositories/event-publication-review.repository';
import { EventStatus } from '../../../domain/types/event-status';
import { EventPublicationReviewStatus } from '../../../domain/types/event-publication-review-status';
import { ApproveEventDto } from '../../dto/admin-review-event.dto';

export class ApproveEventUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly reviewRepo: IEventPublicationReviewRepository,
        private readonly companyRepo: ICompanyRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        adminUserId: string,
        eventId: string,
        dto: ApproveEventDto,
    ): Promise<EventEntity> {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new NotFoundDomainException('Event not found');
        if (event.status !== EventStatus.PENDING_REVIEW) {
            throw new UnprocessableDomainException(
                `Event is not pending review (current status: ${event.status})`,
                'EVENT_NOT_PENDING',
            );
        }

        const pendingReview =
            await this.reviewRepo.findLatestPendingByEvent(eventId);
        if (pendingReview) {
            await this.reviewRepo.update(
                new EventPublicationReviewEntity({
                    id: pendingReview.id,
                    createdAt: pendingReview.createdAt,
                    eventId: pendingReview.eventId,
                    submittedByUserId: pendingReview.submittedByUserId,
                    reviewedByUserId: adminUserId,
                    status: EventPublicationReviewStatus.APPROVED,
                    reviewNotes: dto.reviewNotes ?? null,
                    submittedAt: pendingReview.submittedAt,
                    reviewedAt: new Date(),
                    updatedAt: new Date(),
                }),
            );
        }

        const next = new EventEntity({
            id: event.id,
            createdAt: event.createdAt,
            companyId: event.companyId,
            categoryId: event.categoryId,
            venueId: event.venueId,
            title: event.title,
            slug: event.slug,
            shortDescription: event.shortDescription,
            description: event.description,
            coverImageUrl: event.coverImageUrl,
            bannerImageUrl: event.bannerImageUrl,
            status: EventStatus.APPROVED,
            publicationSubmittedAt: event.publicationSubmittedAt,
            publicationApprovedAt: new Date(),
            publicationRejectedAt: null,
            publicationReviewedBy: adminUserId,
            resaleEnabled: event.resaleEnabled,
            transferEnabled: event.transferEnabled,
            defaultQrVisibleHoursBefore: event.defaultQrVisibleHoursBefore,
            currency: event.currency,
            updatedAt: new Date(),
        });
        const saved = await this.eventRepo.update(next);

        await this.audit.record({
            action: 'event.approved',
            targetType: 'event',
            targetId: saved.id,
            actorUserId: adminUserId,
            metadata: { notes: dto.reviewNotes ?? null },
        });
        await this.notifyOwners(saved, dto.reviewNotes);

        return saved;
    }

    private async notifyOwners(event: EventEntity, notes?: string) {
        try {
            const members = await this.membershipRepo.findByCompany(
                event.companyId,
            );
            const owners = members.filter(
                (m) => m.role === COMPANY_ROLES.OWNER,
            );
            const recipients: string[] = [];
            for (const m of owners) {
                const user = await this.userRepo.findById(m.userId);
                if (user?.email) recipients.push(user.email);
            }
            if (recipients.length === 0) return;

            const body = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Tu evento fue aprobado</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Buenas noticias — <strong style="color:#faf7f0;">${event.title}</strong> pasó la revisión y está listo para publicarse.</p>
${notes ? `<p style="margin:0 0 14px;color:#bfbab1;">Notas del revisor: <em>${notes}</em></p>` : ''}
<p style="margin:0 0 24px;color:#bfbab1;">Entra al panel de organizador para publicarlo y abrir ventas.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ir al panel</a></p>
`.trim();
            await this.email.send({
                to: recipients,
                subject: `HypePass — "${event.title}" aprobado`,
                body,
            });
        } catch {
            /* logged inside EmailService */
        }
    }
}
