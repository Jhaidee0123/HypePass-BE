import { BaseProps } from '../../../shared/domain/types/base.props';

export type EventPromoterProps = BaseProps & {
    eventId: string;
    userId: string;
    referralCode: string;
    assignedByUserId: string;
    note?: string | null;
    revokedAt?: Date | null;
};
