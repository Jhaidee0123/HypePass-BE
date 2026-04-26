import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventStaffRepository } from '../../domain/repositories/event-staff.repository';
import { EventStaffEntity } from '../../domain/entities/event-staff.entity';
import { EventStaffRole } from '../../domain/types/event-staff-role';
import { EventStatus } from '../../domain/types/event-status';
import { AssignEventStaffDto } from '../dto/assign-event-staff.dto';
import { assertEventInCompany } from './helpers/assert-event-ownership';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

export type AssignEventStaffResult = {
    assigned: Array<{
        userId: string;
        email: string;
        role: EventStaffRole;
    }>;
    createdAccounts: string[];
    reusedAccounts: string[];
    alreadyAssigned: string[];
};

/**
 * Owner/admin of the event's company grants checkin (and, eventually, other)
 * staff roles for a specific event. Same find-or-create pattern we use for
 * guest checkout + courtesies: if the email has no HypePass account yet we
 * create one silently and kick off a Better Auth password-reset so the
 * recipient sets their own credentials. Emails are fire-and-forget.
 */
export class AssignEventStaffUseCase {
    private readonly logger = new Logger(AssignEventStaffUseCase.name);

    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly staffRepo: IEventStaffRepository,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly audit: AuditLogService,
        private readonly auth: any,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        actorUserId: string,
        dto: AssignEventStaffDto,
    ): Promise<AssignEventStaffResult> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
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

        // Dedupe emails in the request itself.
        const seen = new Set<string>();
        for (const r of dto.recipients) {
            const key = `${r.email.trim().toLowerCase()}|${r.role}`;
            if (seen.has(key)) {
                throw new ConflictDomainException(
                    `Email ${r.email} is repeated for role ${r.role}`,
                    'DUPLICATE_RECIPIENT',
                );
            }
            seen.add(key);
        }

        const assigned: AssignEventStaffResult['assigned'] = [];
        const createdAccounts: string[] = [];
        const reusedAccounts: string[] = [];
        const alreadyAssigned: string[] = [];

        for (const r of dto.recipients) {
            const email = r.email.trim().toLowerCase();
            const role = r.role as EventStaffRole;

            const { userId, created } = await this.getOrCreateUser(
                email,
                r.fullName,
            );
            if (created) createdAccounts.push(email);
            else reusedAccounts.push(email);

            const existing = await this.staffRepo.findOne(
                event.id,
                userId,
                role,
            );
            if (existing) {
                // Idempotent: refresh note + assignedBy in case they changed.
                await this.staffRepo.update(
                    new EventStaffEntity({
                        id: existing.id,
                        eventId: existing.eventId,
                        userId: existing.userId,
                        role: existing.role,
                        assignedByUserId: actorUserId,
                        note: r.note ?? existing.note,
                        createdAt: existing.createdAt,
                        updatedAt: new Date(),
                    }),
                );
                alreadyAssigned.push(email);
            } else {
                await this.staffRepo.create(
                    new EventStaffEntity({
                        eventId: event.id,
                        userId,
                        role,
                        assignedByUserId: actorUserId,
                        note: r.note ?? null,
                    }),
                );
            }

            assigned.push({ userId, email, role });

            // Notify. Don't block on email failures.
            void this.sendAssignmentEmail(email, r.fullName, event.title, created);
        }

        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'staff.assigned',
                targetType: 'event',
                targetId: event.id,
                metadata: {
                    count: assigned.length,
                    createdAccounts,
                    reusedAccounts,
                    alreadyAssigned,
                    roles: assigned.map((a) => a.role),
                },
            })
            .catch(() => undefined);

        return { assigned, createdAccounts, reusedAccounts, alreadyAssigned };
    }

    private async getOrCreateUser(
        email: string,
        name: string,
    ): Promise<{ userId: string; created: boolean }> {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) return { userId: existing.id, created: false };

        const password = randomBytes(12).toString('base64url');
        try {
            await this.auth.api.signUpEmail({
                body: { email, password, name },
                asResponse: false,
            });
        } catch (err: any) {
            throw new Error(
                `Could not create staff account for ${email}: ${err?.message ?? 'unknown'}`,
            );
        }
        const created = await this.userRepo.findByEmail(email);
        if (!created) {
            throw new Error(
                `Staff account for ${email} was not created correctly`,
            );
        }
        void this.sendSetPasswordLink(email);
        void password; // random pwd never leaves the server
        return { userId: created.id, created: true };
    }

    private async sendSetPasswordLink(email: string): Promise<void> {
        try {
            const redirectTo = `${process.env.APP_URL ?? ''}/reset-password`;
            await this.auth.api.requestPasswordReset({
                body: { email, redirectTo },
                asResponse: false,
            });
        } catch (err: any) {
            this.logger.warn(
                `requestPasswordReset for staff ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }

    private async sendAssignmentEmail(
        email: string,
        name: string,
        eventTitle: string,
        accountCreated: boolean,
    ): Promise<void> {
        try {
            const passwordLine = accountCreated
                ? `<p style="margin:0 0 14px;color:#bfbab1;">Como es tu primera vez en HypePass, por separado te enviamos un correo con un enlace para <strong style="color:#d7ff3a;">establecer tu contraseña</strong>.</p>`
                : '';
            await this.email.send({
                to: email,
                subject: `HypePass — Eres staff del evento ${eventTitle}`,
                body: `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Fuiste asignado como staff</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Hola <strong style="color:#faf7f0;">${name}</strong>,</p>
<p style="margin:0 0 14px;color:#bfbab1;">El organizador del evento <strong style="color:#faf7f0;">${eventTitle}</strong> te asignó como staff. Vas a poder hacer check-in de tickets el día del evento desde la app.</p>
${passwordLine}
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/checkin" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Abrir check-in</a></p>
`.trim(),
            });
        } catch (err: any) {
            this.logger.warn(
                `staff assignment email to ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }
}
