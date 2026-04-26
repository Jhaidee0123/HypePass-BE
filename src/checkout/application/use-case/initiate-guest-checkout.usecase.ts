import { Inject, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BETTER_AUTH } from '../../../auth/constants';
import { EmailService } from '../../../shared/infrastructure/services/email.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { RecordConsentUseCase } from '../../../consents/application/use-case/record-consent.usecase';
import { GuestInitiateCheckoutDto } from '../dto/initiate-checkout.dto';
import { InitiateCheckoutResponse } from '../types/initiate-checkout-response';
import { InitiateCheckoutUseCase } from './initiate-checkout.usecase';

/**
 * Guest checkout = same flow as authenticated, but we first ensure the user
 * exists in Better Auth so the ticket has a real owner. If the email is new,
 * we create the account with a strong random password (never surfaced) and
 * then kick off a Better Auth `requestPasswordReset` so the user receives a reset
 * link to set their own password. A separate welcome email points them at
 * their wallet.
 */
export class InitiateGuestCheckoutUseCase {
    private readonly logger = new Logger(InitiateGuestCheckoutUseCase.name);

    constructor(
        private readonly initiate: InitiateCheckoutUseCase,
        private readonly userRepo: IUserRepository,
        private readonly email: EmailService,
        @Inject(BETTER_AUTH) private readonly auth: any,
        private readonly recordConsent: RecordConsentUseCase,
    ) {}

    async execute(
        dto: GuestInitiateCheckoutDto,
        requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
    ): Promise<InitiateCheckoutResponse> {
        const user = await this.getOrCreateUser(dto.customerEmail, dto.customerFullName);

        // Append consent every time the guest flow runs so we have an
        // audit trail of accepted versions, even for returning guests.
        await this.recordConsent
            .execute({
                userId: user.id,
                termsVersion: dto.acceptedTermsVersion,
                privacyVersion: dto.acceptedPrivacyVersion,
                source: 'guest_checkout',
                ipAddress: requestMeta?.ipAddress ?? null,
                userAgent: requestMeta?.userAgent ?? null,
            })
            .catch((err) =>
                this.logger.warn(
                    `recordConsent failed for guest ${user.email}: ${err?.message}`,
                ),
            );

        return this.initiate.execute({
            userId: user.id,
            buyerEmail: user.email,
            buyerFullName: dto.customerFullName,
            buyerPhone: dto.customerPhone,
            buyerLegalId: dto.customerLegalId,
            buyerLegalIdType: dto.customerLegalIdType,
            referralCode: dto.referralCode,
            selection: {
                eventId: dto.eventId,
                eventSessionId: dto.eventSessionId,
                ticketSectionId: dto.ticketSectionId,
                ticketSalePhaseId: dto.ticketSalePhaseId,
                quantity: dto.quantity,
            },
        });
    }

    private async getOrCreateUser(
        email: string,
        name: string,
    ): Promise<{ id: string; email: string }> {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) return { id: existing.id, email: existing.email };

        const password = this.generatePassword();
        try {
            await this.auth.api.signUpEmail({
                body: { email, password, name },
                asResponse: false,
            });
        } catch (err: any) {
            throw new Error(
                `Could not create guest account: ${err?.message ?? 'unknown'}`,
            );
        }

        const created = await this.userRepo.findByEmail(email);
        if (!created) {
            throw new Error('Guest account was not created correctly');
        }

        // Kick off a password-reset email so the user sets their own pwd.
        // The random one above never leaves the server.
        void this.sendSetPasswordLink(email);

        // Separate welcome/receipt email — purely informational. The magic
        // link arrives from the branded `sendResetPassword` template in
        // BetterAuthModule.
        void this.email.send({
            to: email,
            subject: `HypePass — Tu cuenta está lista`,
            body: `
<h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Bienvenido a HypePass</h2>
<p style="margin:0 0 14px;color:#bfbab1;">Creamos una cuenta para <strong style="color:#faf7f0;">${name}</strong>. Por separado te enviamos un correo con un enlace para <strong style="color:#d7ff3a;">establecer tu contraseña</strong>.</p>
<p style="margin:0 0 14px;color:#bfbab1;">Una vez la definas podrás entrar a ver y administrar tus tickets.</p>
<p style="margin:0;"><a href="${process.env.APP_URL ?? ''}/login" style="display:inline-block;padding:12px 24px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;border-radius:4px;">Ir al login</a></p>
`.trim(),
        });

        // The random password is intentionally discarded — reset-link is the
        // only way the user ever signs in.
        void password;

        return { id: created.id, email: created.email };
    }

    private async sendSetPasswordLink(email: string): Promise<void> {
        try {
            const redirectTo = `${process.env.APP_URL ?? ''}/reset-password`;
            await this.auth.api.requestPasswordReset({
                body: { email, redirectTo },
                asResponse: false,
            });
        } catch (err: any) {
            // Non-fatal: the welcome email still tells the user what happened.
            this.logger.warn(
                `requestPasswordReset for guest ${email} failed: ${err?.message ?? 'unknown'}`,
            );
        }
    }

    private generatePassword(): string {
        // 12-byte random base64 (URL-safe) → ~16 chars, strong enough.
        return randomBytes(12).toString('base64url');
    }
}
