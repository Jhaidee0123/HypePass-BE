import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketTransferEntity } from '../../../tickets/domain/entities/ticket-transfer.entity';
import { ITicketTransferRepository } from '../../../tickets/domain/repositories/ticket-transfer.repository';
import { ITicketQrTokenRepository } from '../../../tickets/domain/repositories/ticket-qr-token.repository';
import {
    OWNABLE_TICKET_STATUSES,
    TicketStatus,
} from '../../../tickets/domain/types/ticket-status';
import { TicketTransferStatus } from '../../../tickets/domain/types/ticket-transfer-status';
import { TransferTicketDto } from '../dto/transfer-ticket.dto';

export type TransferResult = {
    transferId: string;
    ticketId: string;
    fromUserId: string;
    toUserId: string;
    completedAt: string;
    newOwnershipVersion: number;
    newQrGenerationVersion: number;
};

/**
 * Direct user-to-user transfer. Atomic: locks the ticket row, validates the
 * recipient is a registered user (≠ current owner), checks business rules,
 * bumps ownership + QR generation versions, invalidates any active QR tokens,
 * and writes an audit row in `ticket_transfers`.
 *
 * Enforced rules:
 *   - recipient must exist in HypePass
 *   - cannot transfer to self
 *   - ticket must be in an "ownable" state (ISSUED / LISTED / RESERVED_FOR_RESALE)
 *     — practically only ISSUED transfers; listed/reserved are blocked here
 *   - not past session.transferCutoffAt
 *   - event/session not cancelled/ended
 *   - event.transferEnabled === true
 */
export class TransferTicketUseCase {
    private readonly logger = new Logger(TransferTicketUseCase.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly userRepo: IUserRepository,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly transferRepo: ITicketTransferRepository,
        private readonly qrTokenRepo: ITicketQrTokenRepository,
        private readonly email: EmailService,
    ) {}

    async execute(
        fromUserId: string,
        ticketId: string,
        dto: TransferTicketDto,
    ): Promise<TransferResult> {
        const recipient = await this.userRepo.findByEmail(dto.recipientEmail);
        if (!recipient) {
            throw new NotFoundDomainException(
                'No HypePass user with that email',
                'RECIPIENT_NOT_REGISTERED',
            );
        }
        if (recipient.id === fromUserId) {
            throw new UnprocessableDomainException(
                'Cannot transfer a ticket to yourself',
                'TRANSFER_TO_SELF',
            );
        }

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const ticket = await qr.manager.findOne(TicketOrmEntity, {
                where: { id: ticketId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!ticket) {
                throw new NotFoundDomainException('Ticket not found');
            }
            if (ticket.currentOwnerUserId !== fromUserId) {
                throw new ForbiddenDomainException(
                    'This ticket is not in your wallet',
                );
            }
            if (!OWNABLE_TICKET_STATUSES.includes(ticket.status)) {
                throw new UnprocessableDomainException(
                    `Ticket cannot be transferred (status: ${ticket.status})`,
                    'TICKET_NOT_TRANSFERABLE',
                );
            }
            if (ticket.status !== TicketStatus.ISSUED) {
                throw new UnprocessableDomainException(
                    'Ticket is listed or reserved — cancel the listing first',
                    'TICKET_LISTED_OR_RESERVED',
                );
            }

            const event = await this.eventRepo.findById(ticket.eventId);
            const session = await this.sessionRepo.findById(
                ticket.eventSessionId,
            );
            if (!event || !session) {
                throw new NotFoundDomainException('Ticket context missing');
            }
            if (!event.transferEnabled) {
                throw new ConflictDomainException(
                    'Transfers are disabled for this event',
                    'TRANSFER_DISABLED',
                );
            }
            const now = new Date();
            if (
                session.transferCutoffAt &&
                now.getTime() >= session.transferCutoffAt.getTime()
            ) {
                throw new UnprocessableDomainException(
                    'Transfer cutoff has passed',
                    'TRANSFER_CUTOFF',
                );
            }
            if (
                session.status === 'cancelled' ||
                session.status === 'ended' ||
                event.status === 'cancelled' ||
                event.status === 'ended'
            ) {
                throw new UnprocessableDomainException(
                    'Event or session is no longer active',
                    'EVENT_INACTIVE',
                );
            }

            // Bump versions + change owner
            const newOwnershipVersion = ticket.ownershipVersion + 1;
            const newQrGenerationVersion = ticket.qrGenerationVersion + 1;
            await qr.manager.update(TicketOrmEntity, ticket.id, {
                currentOwnerUserId: recipient.id,
                ownershipVersion: newOwnershipVersion,
                qrGenerationVersion: newQrGenerationVersion,
                status: TicketStatus.ISSUED,
                updatedAt: now,
            });

            // Invalidate every active QR token
            await this.qrTokenRepo.deactivateAllForTicket(ticket.id);

            // Audit row
            const transfer = await this.transferRepo.create(
                new TicketTransferEntity({
                    ticketId: ticket.id,
                    fromUserId,
                    toUserId: recipient.id,
                    status: TicketTransferStatus.COMPLETED,
                    note: dto.note ?? null,
                    initiatedAt: now,
                    completedAt: now,
                    resultingOwnershipVersion: newOwnershipVersion,
                    resultingQrGenerationVersion: newQrGenerationVersion,
                }),
            );

            await qr.commitTransaction();

            await this.notify(
                fromUserId,
                recipient.id,
                recipient.email,
                event.title,
                dto.note,
            );

            return {
                transferId: transfer.id,
                ticketId: ticket.id,
                fromUserId,
                toUserId: recipient.id,
                completedAt: now.toISOString(),
                newOwnershipVersion,
                newQrGenerationVersion,
            };
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    private async notify(
        fromUserId: string,
        toUserId: string,
        toEmail: string,
        eventTitle: string,
        note?: string,
    ): Promise<void> {
        try {
            const sender = await this.userRepo.findById(fromUserId);

            const recipientBody = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Recibiste un ticket</h2>
<p style="margin:0 0 14px;color:#bfbab1;"><strong style="color:#faf7f0;">${sender?.name ?? sender?.email ?? 'Un usuario'}</strong> te transfirió un ticket para <strong style="color:#faf7f0;">${eventTitle}</strong>.</p>
${note ? `<p style="margin:0 0 14px;padding:12px 14px;background:#121110;border:1px solid #242320;border-radius:4px;color:#ece8e0;font-size:13px;"><em>"${note}"</em></p>` : ''}
<p style="margin:0 0 24px;color:#bfbab1;">Entra a tu wallet para verlo. El QR se habilitará automáticamente cerca de la fecha del evento.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/wallet" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ver mi wallet</a></p>
`.trim();

            await this.email.send({
                to: toEmail,
                subject: `HypePass — Recibiste un ticket para "${eventTitle}"`,
                body: recipientBody,
            });

            if (sender?.email) {
                const senderBody = `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Transferencia enviada</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Tu ticket para <strong style="color:#faf7f0;">${eventTitle}</strong> fue transferido a <strong style="color:#faf7f0;">${toEmail}</strong>. Ya no aparece en tu wallet.</p>
<p style="margin:0;color:#6b6760;font-size:12px;">Si esto no fuiste tú, contacta soporte de inmediato.</p>
`.trim();
                await this.email.send({
                    to: sender.email,
                    subject: `HypePass — Transferencia completada`,
                    body: senderBody,
                });
            }
        } catch {
            /* logged inside EmailService */
        }
    }
}
