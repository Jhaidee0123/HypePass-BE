import { UserConsentEntity } from '../../domain/entities/user-consent.entity';
import { IUserConsentRepository } from '../../domain/repositories/user-consent.repository';

export type RecordConsentInput = {
    userId: string;
    termsVersion: string;
    privacyVersion: string;
    source: string;
    ipAddress?: string | null;
    userAgent?: string | null;
};

/**
 * Append-only: every call writes a new row. Never throws on the business
 * path — a failure to persist consent should not block the signup / checkout
 * that's driving it; the controller logs and moves on.
 */
export class RecordConsentUseCase {
    constructor(private readonly repo: IUserConsentRepository) {}

    execute(input: RecordConsentInput): Promise<UserConsentEntity> {
        return this.repo.create(
            new UserConsentEntity({
                userId: input.userId,
                termsVersion: input.termsVersion,
                privacyVersion: input.privacyVersion,
                source: input.source,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                acceptedAt: new Date(),
            }),
        );
    }
}
