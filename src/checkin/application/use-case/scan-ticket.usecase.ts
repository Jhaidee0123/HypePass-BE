import { ForbiddenDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { QrTokenService } from '../../../shared/infrastructure/services/qr-token.service';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { IEventStaffRepository } from '../../../events/domain/repositories/event-staff.repository';
import { EventStaffRole } from '../../../events/domain/types/event-staff-role';
import { ICompanyMembershipRepository } from '../../../companies/domain/repositories/company-membership.repository';
import { COMPANY_ROLES, SYSTEM_ROLES } from '../../../auth/constants';
import { UserSession } from '../../../auth/types';
import { CheckinEntity } from '../../../tickets/domain/entities/checkin.entity';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { ICheckinRepository } from '../../../tickets/domain/repositories/checkin.repository';
import {
    CheckinRejectionReason,
    CheckinResult,
} from '../../../tickets/domain/types/checkin-rejection-reason';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { computeQrVisibleFrom } from '../../../tickets/domain/helpers/qr-visibility';
import { ScanTicketDto } from '../dto/scan-ticket.dto';

export type ScanResult = {
    result: CheckinResult;
    reason?: CheckinRejectionReason;
    ticket?: {
        id: string;
        eventTitle: string;
        sessionName: string | null;
        sectionName: string;
        ownerName: string | null;
    };
    scannedAt: string;
};

export class ScanTicketUseCase {
    constructor(
        private readonly ticketRepo: ITicketRepository,
        private readonly checkinRepo: ICheckinRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly membershipRepo: ICompanyMembershipRepository,
        private readonly staffRepo: IEventStaffRepository,
        private readonly tokens: QrTokenService,
        private readonly config: {
            platformDefaultHoursBefore: number;
            graceMinutes: number;
        },
    ) {}

    async execute(
        session: UserSession,
        dto: ScanTicketDto,
    ): Promise<ScanResult> {
        const now = new Date();
        const verified = this.tokens.verify(dto.token);
        if (!verified.ok) {
            return this.recordRejection(
                now,
                null,
                null,
                session.user.id,
                dto.scannerDeviceId,
                verified.reason === 'expired'
                    ? CheckinRejectionReason.TOKEN_EXPIRED
                    : verified.reason === 'signature'
                      ? CheckinRejectionReason.TAMPERED_TOKEN
                      : CheckinRejectionReason.INVALID_TOKEN,
            );
        }

        const payload = verified.payload;
        const ticket = await this.ticketRepo.findById(payload.tid);
        if (!ticket) {
            return this.recordRejection(
                now,
                null,
                null,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.TICKET_NOT_FOUND,
            );
        }

        // Staleness: token pinned to qrGenerationVersion & ownershipVersion.
        if (
            payload.qrv !== ticket.qrGenerationVersion ||
            payload.ov !== ticket.ownershipVersion
        ) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.STALE_TOKEN,
            );
        }

        // Ticket status checks
        const statusRejection = this.rejectionForStatus(ticket.status);
        if (statusRejection) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                statusRejection,
            );
        }

        // Session / event context
        if (
            dto.expectedSessionId &&
            dto.expectedSessionId !== ticket.eventSessionId
        ) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.WRONG_SESSION,
            );
        }

        const ticketSession = await this.sessionRepo.findById(
            ticket.eventSessionId,
        );
        const event = await this.eventRepo.findById(ticket.eventId);
        if (!ticketSession || !event) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.WRONG_EVENT,
            );
        }

        // Scanner authorization — three paths (any one passes):
        //   1) platform_admin bypass
        //   2) owner/admin of the event's company (company-level fallback for
        //      organizers managing their own events)
        //   3) has an active per-event staff assignment for this event
        // Per-event staff is the primary model (replaces the legacy
        // `company_memberships.role = 'checkin_staff'`).
        if (session.user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
            const membership = await this.membershipRepo.findOne(
                event.companyId,
                session.user.id,
            );
            const isCompanyAdmin =
                !!membership &&
                (membership.role === COMPANY_ROLES.OWNER ||
                    membership.role === COMPANY_ROLES.ADMIN);
            if (!isCompanyAdmin) {
                const assignment = await this.staffRepo.findOne(
                    event.id,
                    session.user.id,
                    EventStaffRole.CHECKIN_STAFF,
                );
                if (!assignment) {
                    throw new ForbiddenDomainException(
                        'You are not assigned as staff for this event',
                        'NOT_EVENT_STAFF',
                    );
                }
            }
        }

        // Session open? checkinStartAt ≤ now < endsAt + grace
        const graceMs = this.config.graceMinutes * 60 * 1000;
        const open = ticketSession.checkinStartAt ?? ticketSession.startsAt;
        const close = new Date(ticketSession.endsAt.getTime() + graceMs);
        if (now.getTime() < open.getTime() || now.getTime() > close.getTime()) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.SESSION_NOT_OPEN,
            );
        }

        // QR visibility window open?
        const qrVisible = computeQrVisibleFrom(
            ticketSession,
            event,
            this.config.platformDefaultHoursBefore,
        );
        if (now.getTime() < qrVisible.getTime()) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.QR_NOT_YET_VALID,
            );
        }

        // Already checked in?
        const accepted = await this.checkinRepo.findAcceptedByTicket(
            ticket.id,
        );
        if (accepted) {
            return this.recordRejection(
                now,
                ticket.id,
                ticket.eventSessionId,
                session.user.id,
                dto.scannerDeviceId,
                CheckinRejectionReason.ALREADY_CHECKED_IN,
            );
        }

        // Accept: record check-in + mark ticket CHECKED_IN
        await this.checkinRepo.create(
            new CheckinEntity({
                ticketId: ticket.id,
                eventSessionId: ticket.eventSessionId,
                scannedByUserId: session.user.id,
                scannerDeviceId: dto.scannerDeviceId ?? null,
                result: CheckinResult.ACCEPTED,
                rejectionReason: null,
                scannedAt: now,
            }),
        );

        await this.ticketRepo.update(
            Object.assign(Object.create(Object.getPrototypeOf(ticket)), ticket, {
                status: TicketStatus.CHECKED_IN,
                updatedAt: now,
            }),
        );

        return {
            result: CheckinResult.ACCEPTED,
            ticket: {
                id: ticket.id,
                eventTitle: event.title,
                sessionName: ticketSession.name ?? null,
                sectionName: '',
                ownerName: null,
            },
            scannedAt: now.toISOString(),
        };
    }

    private rejectionForStatus(
        status: TicketStatus,
    ): CheckinRejectionReason | null {
        switch (status) {
            case TicketStatus.ISSUED:
                return null;
            case TicketStatus.CHECKED_IN:
                return CheckinRejectionReason.ALREADY_CHECKED_IN;
            case TicketStatus.REFUNDED:
                return CheckinRejectionReason.TICKET_REFUNDED;
            case TicketStatus.VOIDED:
            case TicketStatus.EXPIRED:
                return CheckinRejectionReason.TICKET_VOIDED;
            case TicketStatus.TRANSFERRED:
                return CheckinRejectionReason.TICKET_TRANSFERRED;
            case TicketStatus.LISTED:
            case TicketStatus.RESERVED_FOR_RESALE:
                return CheckinRejectionReason.TICKET_LISTED;
            default:
                return CheckinRejectionReason.INVALID_TOKEN;
        }
    }

    private async recordRejection(
        now: Date,
        ticketId: string | null,
        sessionId: string | null,
        userId: string,
        scannerDeviceId: string | undefined,
        reason: CheckinRejectionReason,
    ): Promise<ScanResult> {
        await this.checkinRepo.create(
            new CheckinEntity({
                ticketId,
                eventSessionId: sessionId,
                scannedByUserId: userId,
                scannerDeviceId: scannerDeviceId ?? null,
                result: CheckinResult.REJECTED,
                rejectionReason: reason,
                scannedAt: now,
            }),
        );
        return {
            result: CheckinResult.REJECTED,
            reason,
            scannedAt: now.toISOString(),
        };
    }
}
