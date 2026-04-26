import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventPromoterRepository } from '../../domain/repositories/event-promoter.repository';
import { EventPromoterEntity } from '../../domain/entities/event-promoter.entity';
import { EventStatus } from '../../domain/types/event-status';
import { AssignEventPromotersDto } from '../dto/assign-event-promoters.dto';
import { EventPromoterService } from '../services/event-promoter.service';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export type AssignedPromoterRow = {
    userId: string;
    email: string;
    referralCode: string;
};

export type AssignEventPromotersResult = {
    assigned: AssignedPromoterRow[];
    createdAccounts: string[];
    reusedAccounts: string[];
    alreadyAssigned: string[];
};

/**
 * Same find-or-create + invitation pattern as `AssignEventStaffUseCase`.
 * Differences: generates a referral code per promoter; idempotent on
 * (event, user) — re-assigning an existing active promoter just refreshes
 * the note. The referral_code is NOT rotated on re-assign (organizer can
 * revoke + re-add to force a new code).
 */
export class AssignEventPromotersUseCase {
    private readonly logger = new Logger(AssignEventPromotersUseCase.name);

    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly promoterService: EventPromoterService,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        private readonly audit: AuditLogService,
        private readonly auth: any,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        actorUserId: string,
        dto: AssignEventPromotersDto,
    ): Promise<AssignEventPromotersResult> {
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
            const key = r.email.trim().toLowerCase();
            if (seen.has(key)) {
                throw new ConflictDomainException(
                    `Email ${r.email} is repeated`,
                    'DUPLICATE_RECIPIENT',
                );
            }
            seen.add(key);
        }

        const assigned: AssignedPromoterRow[] = [];
        const createdAccounts: string[] = [];
        const reusedAccounts: string[] = [];
        const alreadyAssigned: string[] = [];

        for (const r of dto.recipients) {
            const email = r.email.trim().toLowerCase();
            const fullName = r.fullName.trim();

            const { userId, created } = await this.getOrCreateUser(email, fullName);
            if (created) createdAccounts.push(email);
            else reusedAccounts.push(email);

            const existing =
                await this.promoterService.findActiveByEventAndUser(event.id, userId);

            let referralCode: string;
            if (existing) {
                // Idempotent refresh — keep code, refresh note + assignedBy.
                await this.promoterService.update(
                    new EventPromoterEntity({
                        id: existing.id,
                        eventId: existing.eventId,
                        userId: existing.userId,
                        referralCode: existing.referralCode,
                        assignedByUserId: actorUserId,
                        note: r.note ?? existing.note,
                        revokedAt: null,
                        createdAt: existing.createdAt,
                        updatedAt: new Date(),
                    }),
                );
                referralCode = existing.referralCode;
                alreadyAssigned.push(email);
            } else {
                referralCode =
                    await this.promoterService.generateUniqueCodeForEvent(
                        event.id,
                        event.slug,
                    );
                await this.promoterService.create(
                    new EventPromoterEntity({
                        eventId: event.id,
                        userId,
                        referralCode,
                        assignedByUserId: actorUserId,
                        note: r.note ?? null,
                    }),
                );
            }

            assigned.push({ userId, email, referralCode });

            void this.sendAssignmentEmail(
                email,
                fullName,
                event.title,
                event.slug,
                referralCode,
                created,
            );
        }

        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'promoter.assigned',
                targetType: 'event',
                targetId: event.id,
                metadata: {
                    count: assigned.length,
                    createdAccounts,
                    reusedAccounts,
                    alreadyAssigned,
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
                `Could not create promoter account for ${email}: ${err?.message ?? 'unknown'}`,
            );
        }
        const created = await this.userRepo.findByEmail(email);
        if (!created) {
            throw new Error(
                `Promoter account for ${email} was not created correctly`,
            );
        }
        void this.sendSetPasswordLink(email);
        void password;
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
                `requestPasswordReset for promoter ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }

    private async sendAssignmentEmail(
        email: string,
        name: string,
        eventTitle: string,
        eventSlug: string,
        referralCode: string,
        accountCreated: boolean,
    ): Promise<void> {
        try {
            const appUrl = process.env.APP_URL ?? '';
            const referralLink = `${appUrl}/events/${eventSlug}?ref=${referralCode}`;
            const passwordLine = accountCreated
                ? `<p style="margin:0 0 14px;color:#bfbab1;">Como es tu primera vez en HypePass, te enviamos por separado un correo con un enlace para <strong style="color:#d7ff3a;">establecer tu contraseña</strong>.</p>`
                : '';
            await this.email.send({
                to: email,
                subject: `HypePass — Eres promotor de ${eventTitle}`,
                body: `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Fuiste asignado como promotor</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Hola <strong style="color:#faf7f0;">${name}</strong>,</p>
<p style="margin:0 0 14px;color:#bfbab1;">El organizador de <strong style="color:#faf7f0;">${eventTitle}</strong> te asignó como promotor. Comparte tu link y cada compra que entre por él se te atribuirá automáticamente.</p>
<div style="margin:0 0 14px;padding:14px 16px;background:#1a1917;border:1px solid #34312c;border-radius:6px;">
  <div style="font-family:monospace;font-size:11px;color:#908b83;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Tu código</div>
  <div style="font-family:monospace;font-size:18px;color:#d7ff3a;letter-spacing:0.04em;">${referralCode}</div>
  <div style="font-family:monospace;font-size:11px;color:#908b83;margin-top:10px;word-break:break-all;">${referralLink}</div>
</div>
${passwordLine}
<p style="margin:0;"><a href="${appUrl}/promoter" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ver mi panel de promotor</a></p>
`.trim(),
            });
        } catch (err: any) {
            this.logger.warn(
                `promoter assignment email to ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }
}
