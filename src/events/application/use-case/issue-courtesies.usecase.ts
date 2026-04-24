import { DataSource, In } from 'typeorm';
import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { EventStatus } from '../../domain/types/event-status';
import { TicketSectionOrmEntity } from '../../infrastructure/orm/ticket-section.orm.entity';
import { OrderOrmEntity } from '../../../tickets/infrastructure/orm/order.orm.entity';
import { OrderItemOrmEntity } from '../../../tickets/infrastructure/orm/order-item.orm.entity';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { InventoryHoldOrmEntity } from '../../../tickets/infrastructure/orm/inventory-hold.orm.entity';
import { InventoryHoldStatus } from '../../../tickets/domain/types/inventory-hold-status';
import {
    OWNABLE_TICKET_STATUSES,
    TicketStatus,
} from '../../../tickets/domain/types/ticket-status';
import { OrderStatus, OrderType } from '../../../tickets/domain/types/order-status';
import { IssueCourtesiesDto } from '../dto/issue-courtesies.dto';
import { assertSectionInSessionHierarchy } from './helpers/assert-event-ownership';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

export type IssueCourtesiesResult = {
    issued: Array<{
        ticketId: string;
        recipientEmail: string;
        recipientName: string;
    }>;
    createdAccounts: string[];
    reusedAccounts: string[];
};

/**
 * Organizer-facing use case: mint free "courtesy" tickets for one or more
 * recipients on a given session + section. If the recipient has no account
 * yet we create one silently (Better Auth signUp + a reset-password email so
 * they set their own credentials) — same pattern as guest checkout.
 *
 * Courtesy tickets are indistinguishable from purchased ones in the wallet
 * *except* that `tickets.courtesy=true` blocks the resale flow. Transfers
 * remain allowed.
 */
export class IssueCourtesiesUseCase {
    private readonly logger = new Logger(IssueCourtesiesUseCase.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly audit: AuditLogService,
        private readonly auth: any,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        actorUserId: string,
        dto: IssueCourtesiesDto,
    ): Promise<IssueCourtesiesResult> {
        const { event, session, section } =
            await assertSectionInSessionHierarchy(
                this.eventRepo,
                this.sessionRepo,
                this.sectionRepo,
                companyId,
                eventId,
                dto.eventSessionId,
                dto.ticketSectionId,
            );

        if (
            event.status === EventStatus.CANCELLED ||
            event.status === EventStatus.ENDED
        ) {
            throw new UnprocessableDomainException(
                'Event is not active',
                'EVENT_INACTIVE',
            );
        }

        // Resolve (find-or-create) one user per recipient BEFORE the tx so
        // Better Auth's own write path doesn't conflict with our section lock.
        const resolved: Array<{
            userId: string;
            email: string;
            name: string;
            created: boolean;
        }> = [];
        const seenEmails = new Set<string>();
        for (const r of dto.recipients) {
            const normalizedEmail = r.email.trim().toLowerCase();
            if (seenEmails.has(normalizedEmail)) {
                throw new ConflictDomainException(
                    `Email ${normalizedEmail} is repeated in recipients`,
                    'DUPLICATE_RECIPIENT',
                );
            }
            seenEmails.add(normalizedEmail);
            const res = await this.getOrCreateUser(normalizedEmail, r.fullName);
            resolved.push({ ...res, name: r.fullName });
        }

        const qty = dto.recipients.length;

        // Main tx: lock section row, re-check capacity, create 1 order + N items + N tickets.
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const locked = await qr.manager.findOne(TicketSectionOrmEntity, {
                where: { id: section.id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!locked) {
                throw new UnprocessableDomainException(
                    'Section no longer exists',
                    'SECTION_MISSING',
                );
            }

            const issuedCount = await qr.manager.count(TicketOrmEntity, {
                where: {
                    ticketSectionId: section.id,
                    status: In(OWNABLE_TICKET_STATUSES),
                },
            });
            const now = new Date();
            const activeHoldsRaw = await qr.manager
                .createQueryBuilder(InventoryHoldOrmEntity, 'h')
                .select('COALESCE(SUM(h.quantity), 0)', 'sum')
                .where('h.ticket_section_id = :sid', { sid: section.id })
                .andWhere('h.status = :status', {
                    status: InventoryHoldStatus.ACTIVE,
                })
                .andWhere('h.expires_at > :now', { now })
                .getRawOne<{ sum: string }>();
            const activeHolds = parseInt(activeHoldsRaw?.sum ?? '0', 10);

            if (issuedCount + activeHolds + qty > locked.totalInventory) {
                throw new ConflictDomainException(
                    `Not enough inventory: capacity ${locked.totalInventory}, ` +
                        `already committed ${issuedCount + activeHolds}, ` +
                        `requested ${qty}`,
                    'CAPACITY_EXCEEDED',
                );
            }

            // Courtesy orders are per-actor (organizer), not per-recipient.
            // Each recipient gets their own order_item + ticket under the
            // same order so revenue stays 0 and audit is grouped.
            const paymentReference = `CRT-${randomBytes(8).toString('hex')}`;
            const order = qr.manager.create(OrderOrmEntity, {
                userId: actorUserId,
                companyId,
                type: OrderType.COURTESY,
                status: OrderStatus.PAID,
                currency: event.currency,
                subtotal: 0,
                serviceFeeTotal: 0,
                platformFeeTotal: 0,
                taxTotal: 0,
                grandTotal: 0,
                paymentProvider: 'courtesy',
                paymentReference,
                buyerFullName: `Courtesy batch (${dto.recipients.length})`,
                buyerEmail: 'courtesy@internal',
            });
            const savedOrder = await qr.manager.save(OrderOrmEntity, order);

            const issued: IssueCourtesiesResult['issued'] = [];
            for (const recipient of resolved) {
                const item = qr.manager.create(OrderItemOrmEntity, {
                    orderId: savedOrder.id,
                    eventId: event.id,
                    eventSessionId: session.id,
                    ticketSectionId: section.id,
                    ticketSalePhaseId: null,
                    quantity: 1,
                    unitPrice: 0,
                    serviceFee: 0,
                    platformFee: 0,
                    taxAmount: 0,
                    lineTotal: 0,
                });
                const savedItem = await qr.manager.save(
                    OrderItemOrmEntity,
                    item,
                );
                const ticket = qr.manager.create(TicketOrmEntity, {
                    orderItemId: savedItem.id,
                    originalOrderId: savedOrder.id,
                    currentOwnerUserId: recipient.userId,
                    eventId: event.id,
                    eventSessionId: session.id,
                    ticketSectionId: section.id,
                    ticketSalePhaseId: null,
                    status: TicketStatus.ISSUED,
                    ownershipVersion: 1,
                    faceValue: 0,
                    currency: event.currency,
                    qrGenerationVersion: 1,
                    courtesy: true,
                });
                const savedTicket = await qr.manager.save(
                    TicketOrmEntity,
                    ticket,
                );
                issued.push({
                    ticketId: savedTicket.id,
                    recipientEmail: recipient.email,
                    recipientName: recipient.name,
                });
            }

            await qr.commitTransaction();

            // Post-commit: fire-and-forget notifications + audit.
            for (const r of resolved) {
                void this.sendCourtesyEmail(r.email, r.name, event.title);
            }
            void this.audit
                .record({
                    actorKind: 'user',
                    actorUserId,
                    action: 'courtesy.issued',
                    targetType: 'event',
                    targetId: event.id,
                    metadata: {
                        sessionId: session.id,
                        sectionId: section.id,
                        count: qty,
                        createdAccounts: resolved
                            .filter((r) => r.created)
                            .map((r) => r.email),
                    },
                })
                .catch(() => undefined);

            return {
                issued,
                createdAccounts: resolved
                    .filter((r) => r.created)
                    .map((r) => r.email),
                reusedAccounts: resolved
                    .filter((r) => !r.created)
                    .map((r) => r.email),
            };
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    private async getOrCreateUser(
        email: string,
        name: string,
    ): Promise<{ userId: string; email: string; created: boolean }> {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) {
            return {
                userId: existing.id,
                email: existing.email,
                created: false,
            };
        }
        const password = randomBytes(12).toString('base64url');
        try {
            await this.auth.api.signUpEmail({
                body: { email, password, name },
                asResponse: false,
            });
        } catch (err: any) {
            throw new Error(
                `Could not create courtesy account for ${email}: ${err?.message ?? 'unknown'}`,
            );
        }
        const created = await this.userRepo.findByEmail(email);
        if (!created) {
            throw new Error(
                `Courtesy account for ${email} was not created correctly`,
            );
        }
        // Trigger the set-password email; random pwd above never leaves the server.
        void this.sendSetPasswordLink(email);
        void password;
        return { userId: created.id, email: created.email, created: true };
    }

    private async sendSetPasswordLink(email: string): Promise<void> {
        try {
            const redirectTo = `${process.env.APP_URL ?? ''}/login`;
            await this.auth.api.forgetPassword({
                body: { email, redirectTo },
                asResponse: false,
            });
        } catch (err: any) {
            this.logger.warn(
                `forgetPassword for courtesy ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }

    private async sendCourtesyEmail(
        email: string,
        name: string,
        eventTitle: string,
    ): Promise<void> {
        try {
            await this.email.send({
                to: email,
                subject: `HypePass — Tienes un ticket de cortesía para ${eventTitle}`,
                body: `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Tienes una cortesía</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Hola <strong style="color:#faf7f0;">${name}</strong>,</p>
<p style="margin:0 0 14px;color:#bfbab1;">El organizador de <strong style="color:#faf7f0;">${eventTitle}</strong> te envió un ticket de cortesía. Está listo en tu wallet de HypePass.</p>
<p style="margin:0 0 14px;color:#bfbab1;">Si es tu primera vez en HypePass, te enviamos por separado un correo con un enlace para <strong style="color:#d7ff3a;">establecer tu contraseña</strong>. Una vez lo hagas vas a poder entrar al wallet y ver el ticket.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/wallet" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ver mi ticket</a></p>
`.trim(),
            });
        } catch (err: any) {
            this.logger.warn(
                `courtesy email to ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }
}
