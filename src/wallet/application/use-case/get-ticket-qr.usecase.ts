import { createHash } from 'crypto';
import {
    ForbiddenDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { QrTokenService } from '../../../shared/infrastructure/services/qr-token.service';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { ITicketQrTokenRepository } from '../../../tickets/domain/repositories/ticket-qr-token.repository';
import { TicketQrTokenEntity } from '../../../tickets/domain/entities/ticket-qr-token.entity';
import { QrTokenReason } from '../../../tickets/domain/types/qr-token-reason';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { computeQrVisibleFrom } from '../../../tickets/domain/helpers/qr-visibility';
import { WalletQrResponse } from '../types/wallet-ticket-view';

/**
 * Returns a short-lived signed QR token for a ticket the caller owns.
 *
 * Refuses if:
 *  - ticket not found
 *  - caller is not the current owner
 *  - ticket status is not ISSUED
 *  - QR visibility window has not opened yet
 *
 * On success, the token payload pins the current qrGenerationVersion and
 * ownershipVersion — any later transfer/resale/rotation invalidates it.
 */
export class GetTicketQrUseCase {
    constructor(
        private readonly ticketRepo: ITicketRepository,
        private readonly qrTokenRepo: ITicketQrTokenRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly tokenService: QrTokenService,
        private readonly platformDefaultHoursBefore: number,
    ) {}

    async execute(userId: string, ticketId: string): Promise<WalletQrResponse> {
        const ticket = await this.ticketRepo.findById(ticketId);
        if (!ticket) throw new NotFoundDomainException('Ticket not found');
        if (ticket.currentOwnerUserId !== userId) {
            throw new ForbiddenDomainException(
                'You do not own this ticket',
            );
        }
        if (ticket.status !== TicketStatus.ISSUED) {
            throw new UnprocessableDomainException(
                `Ticket status "${ticket.status}" is not eligible for QR`,
                'TICKET_NOT_ISSUABLE',
            );
        }

        const session = await this.sessionRepo.findById(ticket.eventSessionId);
        const event = await this.eventRepo.findById(ticket.eventId);
        if (!session || !event) {
            throw new NotFoundDomainException('Ticket context missing');
        }

        const qrVisibleFrom = computeQrVisibleFrom(
            session,
            event,
            this.platformDefaultHoursBefore,
        );
        const now = new Date();
        if (now.getTime() < qrVisibleFrom.getTime()) {
            throw new UnprocessableDomainException(
                `QR becomes available at ${qrVisibleFrom.toISOString()}`,
                'QR_NOT_YET_VISIBLE',
            );
        }

        const { token, payload } = this.tokenService.sign({
            tid: ticket.id,
            qrv: ticket.qrGenerationVersion,
            ov: ticket.ownershipVersion,
        });

        const tokenHash = createHash('sha256').update(token).digest('hex');
        await this.qrTokenRepo.create(
            new TicketQrTokenEntity({
                ticketId: ticket.id,
                tokenHash,
                tokenVersion: ticket.qrGenerationVersion,
                validFrom: new Date(payload.iat * 1000),
                validUntil: new Date(payload.exp * 1000),
                isActive: true,
                generatedReason: QrTokenReason.ISSUE,
            }),
        );

        return {
            ticketId: ticket.id,
            token,
            validUntil: new Date(payload.exp * 1000).toISOString(),
            qrVisibleFrom: qrVisibleFrom.toISOString(),
        };
    }
}
