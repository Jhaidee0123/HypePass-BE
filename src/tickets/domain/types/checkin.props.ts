import { BaseProps } from '../../../shared/domain/types/base.props';
import {
    CheckinRejectionReason,
    CheckinResult,
} from './checkin-rejection-reason';

export type CheckinProps = BaseProps & {
    ticketId?: string | null;
    eventSessionId?: string | null;
    scannedByUserId?: string | null;
    scannerDeviceId?: string | null;
    result: CheckinResult;
    rejectionReason?: CheckinRejectionReason | null;
    scannedAt: Date;
};
