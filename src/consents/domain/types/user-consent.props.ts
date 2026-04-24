import { BaseProps } from '../../../shared/domain/types/base.props';

export type UserConsentProps = BaseProps & {
    userId: string;
    termsVersion: string;
    privacyVersion: string;
    /**
     * Source of the consent: 'signup' (regular form), 'guest_checkout',
     * 'refresh' (re-accepted after version bump), 'import' (migration).
     */
    source: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    acceptedAt: Date;
};
