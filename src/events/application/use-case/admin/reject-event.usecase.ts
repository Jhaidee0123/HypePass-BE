import {
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../../shared/infrastructure/services/email.service';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';
import { ICompanyMembershipRepository } from '../../../../companies/domain/repositories/company-membership.repository';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository';
import { COMPANY_ROLES } from '../../../../auth/constants';
import { EventEntity } from '../../../domain/entities/event.entity';
import { EventPublicationReviewEntity } from '../../../domain/entities/event-publication-review.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IEventPublicationReviewRepository } from '../../../domain/repositories/event-publication-review.repository';
import { EventStatus } from '../../../domain/types/event-status';
import { EventPublicationReviewStatus } from '../../../domain/types/event-publication-review-status';
import { RejectEventDto } from '../../dto/admin-review-event.dto';

export class RejectEventUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly reviewRepo: IEventPublicationReviewRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        adminUserId: string,
        eventId: string,
        dto: RejectEventDto,
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
                    status: EventPublicationReviewStatus.REJECTED,
                    reviewNotes: dto.reviewNotes,
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
            status: EventStatus.REJECTED,
            publicationSubmittedAt: event.publicationSubmittedAt,
            publicationApprovedAt: null,
            publicationRejectedAt: new Date(),
            publicationReviewedBy: adminUserId,
            resaleEnabled: event.resaleEnabled,
            transferEnabled: event.transferEnabled,
            defaultQrVisibleHoursBefore: event.defaultQrVisibleHoursBefore,
            currency: event.currency,
            updatedAt: new Date(),
        });
        const saved = await this.eventRepo.update(next);

        await this.audit.record({
            action: 'event.rejected',
            targetType: 'event',
            targetId: saved.id,
            actorUserId: adminUserId,
            metadata: { notes: dto.reviewNotes },
        });
        await this.notifyOwners(saved, dto.reviewNotes);

        return saved;
    }

    private async notifyOwners(event: EventEntity, notes: string) {
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
<h2 style="margin:0 0 16px;font-size:22px;color:#ff4d5a;">Tu evento fue rechazado</h2>
<p style="margin:0 0 14px;color:#bfbab1;"><strong style="color:#faf7f0;">${event.title}</strong> no pasó la revisión.</p>
<div style="padding:14px 16px;background:#121110;border:1px solid #242320;border-radius:4px;margin:0 0 18px;">
  <div style="font-family:'Courier New',monospace;font-size:10px;color:#6b6760;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Notas del revisor</div>
  <div style="color:#ece8e0;font-size:14px;white-space:pre-wrap;">${notes}</div>
</div>
<p style="margin:0;color:#bfbab1;">Entra al panel, ajusta lo indicado y vuelve a enviarlo a revisión.</p>
`.trim();
            await this.email.send({
                to: recipients,
                subject: `HypePass — "${event.title}" rechazado`,
                body,
            });
        } catch {
            /* logged inside EmailService */
        }
    }
}
