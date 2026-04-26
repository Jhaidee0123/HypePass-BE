import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { AdminNotificationService } from '../../../admin-notifications/application/services/admin-notification.service';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventPublicationReviewEntity } from '../../domain/entities/event-publication-review.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../domain/repositories/ticket-sale-phase.repository';
import { IEventPublicationReviewRepository } from '../../domain/repositories/event-publication-review.repository';
import { EventStatus } from '../../domain/types/event-status';
import { EventPublicationReviewStatus } from '../../domain/types/event-publication-review-status';
import { SubmitForReviewDto } from '../dto/submit-for-review.dto';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class SubmitEventForReviewUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
        private readonly reviewRepo: IEventPublicationReviewRepository,
        private readonly email: EmailService,
        private readonly adminNotifications: AdminNotificationService,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        submittedByUserId: string,
        _dto: SubmitForReviewDto,
    ): Promise<EventEntity> {
        const current = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        if (
            current.status !== EventStatus.DRAFT &&
            current.status !== EventStatus.REJECTED
        ) {
            throw new UnprocessableDomainException(
                `Cannot submit an event currently in status "${current.status}"`,
                'EVENT_NOT_SUBMITTABLE',
            );
        }

        // Structural completeness: at least 1 session with at least 1 section
        // with at least 1 phase.
        const sessions = await this.sessionRepo.findByEvent(current.id);
        if (sessions.length === 0) {
            throw new UnprocessableDomainException(
                'Event must have at least one session',
                'EVENT_NO_SESSIONS',
            );
        }
        for (const session of sessions) {
            const sections = await this.sectionRepo.findByEventSession(
                session.id,
            );
            if (sections.length === 0) {
                throw new UnprocessableDomainException(
                    `Session "${session.name ?? session.id}" has no ticket sections`,
                    'SESSION_NO_SECTIONS',
                );
            }
            for (const section of sections) {
                const phases = await this.phaseRepo.findBySection(section.id);
                if (phases.length === 0) {
                    throw new UnprocessableDomainException(
                        `Section "${section.name}" has no sale phases`,
                        'SECTION_NO_PHASES',
                    );
                }
            }
        }

        const now = new Date();
        const next = new EventEntity({
            id: current.id,
            createdAt: current.createdAt,
            companyId: current.companyId,
            categoryId: current.categoryId,
            venueId: current.venueId,
            title: current.title,
            slug: current.slug,
            shortDescription: current.shortDescription,
            description: current.description,
            coverImageUrl: current.coverImageUrl,
            bannerImageUrl: current.bannerImageUrl,
            status: EventStatus.PENDING_REVIEW,
            publicationSubmittedAt: now,
            publicationApprovedAt: null,
            publicationRejectedAt: null,
            publicationReviewedBy: null,
            resaleEnabled: current.resaleEnabled,
            transferEnabled: current.transferEnabled,
            defaultQrVisibleHoursBefore: current.defaultQrVisibleHoursBefore,
            currency: current.currency,
            resalePriceCapMultiplier: current.resalePriceCapMultiplier,
            resaleFeePct: current.resaleFeePct,
            maxTicketsPerUserPerSession: current.maxTicketsPerUserPerSession,
            locationName: current.locationName,
            locationAddress: current.locationAddress,
            locationLatitude: current.locationLatitude,
            locationLongitude: current.locationLongitude,
            updatedAt: now,
        });
        const saved = await this.eventRepo.update(next);

        // Audit trail row
        await this.reviewRepo.create(
            new EventPublicationReviewEntity({
                eventId: saved.id,
                submittedByUserId,
                reviewedByUserId: null,
                status: EventPublicationReviewStatus.PENDING,
                reviewNotes: null,
                submittedAt: now,
                reviewedAt: null,
            }),
        );

        await this.notifyAdmins(saved);
        void this.adminNotifications.record({
            kind: 'event.submitted',
            level: 'info',
            title: `Evento en revisión: ${saved.title}`,
            body: `/${saved.slug} está esperando aprobación.`,
            metadata: { eventId: saved.id, slug: saved.slug },
        });

        return saved;
    }

    private async notifyAdmins(event: EventEntity): Promise<void> {
        const admins = this.email.adminEmails();
        if (admins.length === 0) return;
        const body = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Nuevo evento en revisión</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Un organizador envió <strong style="color:#faf7f0;">${event.title}</strong> para aprobación.</p>
<p style="margin:0 0 14px;color:#bfbab1;">Revisa los detalles del evento, sesiones, secciones y fases antes de aprobar o rechazar.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/admin" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Abrir panel admin</a></p>
`.trim();
        await this.email.send({
            to: admins,
            subject: `HypePass — Evento "${event.title}" en revisión`,
            body,
        });
    }
}
