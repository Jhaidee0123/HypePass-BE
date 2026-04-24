import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { importEsm } from '../../../auth/esm-loader';
import { wrapInHypePassTemplate } from '../templates/hypepass-template';

export type SendEmailOptions = {
    to: string | string[];
    subject: string;
    body: string;
    /** If true, `body` is sent as-is; otherwise it's wrapped in the HypePass chrome. */
    raw?: boolean;
};

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private resendInstance: any;

    constructor(private readonly config: ConfigService) {}

    private async getResend(): Promise<any> {
        if (!this.resendInstance) {
            const { Resend } = await importEsm('resend');
            this.resendInstance = new Resend(
                this.config.get<string>('RESEND_API_KEY'),
            );
        }
        return this.resendInstance;
    }

    private fromAddress(): string {
        return this.config.get<string>(
            'RESEND_FROM_EMAIL',
            'HypePass <no-reply@hypepass.co>',
        );
    }

    adminEmails(): string[] {
        return (
            this.config
                .get<string>('ADMIN_NOTIFICATION_EMAILS', '')
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean)
        );
    }

    async send(options: SendEmailOptions): Promise<void> {
        const recipients = Array.isArray(options.to)
            ? options.to
            : [options.to];
        const valid = recipients.filter(Boolean);
        if (valid.length === 0) {
            this.logger.warn(
                'EmailService.send called without recipients — skipping',
            );
            return;
        }

        try {
            const resend = await this.getResend();
            const html = options.raw
                ? options.body
                : wrapInHypePassTemplate(options.body);
            // Resend SDK resolves with `{ data, error }` for business-level
            // failures (unverified domain, bad API key, rate limit); only
            // throws on network errors. Check both paths explicitly.
            const result = await resend.emails.send({
                from: this.fromAddress(),
                to: valid,
                subject: options.subject,
                html,
            });
            if (result?.error) {
                this.logger.error(
                    `Resend rejected "${options.subject}" to ${valid.join(
                        ', ',
                    )}: ${result.error.name ?? ''} — ${
                        result.error.message ?? JSON.stringify(result.error)
                    }`,
                );
                return;
            }
            this.logger.log(
                `Sent "${options.subject}" to ${valid.join(', ')} (id=${result?.data?.id ?? 'n/a'})`,
            );
        } catch (err: any) {
            // Never crash the request on email failure; just log it.
            this.logger.error(
                `Email send threw: ${err?.message ?? 'unknown'}`,
            );
        }
    }
}
