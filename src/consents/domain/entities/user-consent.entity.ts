import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { UserConsentProps } from '../types/user-consent.props';

export class UserConsentEntity extends BaseEntity {
    readonly userId: string;
    readonly termsVersion: string;
    readonly privacyVersion: string;
    readonly source: string;
    readonly ipAddress?: string | null;
    readonly userAgent?: string | null;
    readonly acceptedAt: Date;

    constructor(props: UserConsentProps) {
        super(props);
        this.userId = props.userId;
        this.termsVersion = props.termsVersion;
        this.privacyVersion = props.privacyVersion;
        this.source = props.source;
        this.ipAddress = props.ipAddress ?? null;
        this.userAgent = props.userAgent ?? null;
        this.acceptedAt = props.acceptedAt;
    }
}
