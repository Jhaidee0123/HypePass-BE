import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import {
    CheckinRejectionReason,
    CheckinResult,
} from '../types/checkin-rejection-reason';
import { CheckinProps } from '../types/checkin.props';

export class CheckinEntity extends BaseEntity {
    readonly ticketId?: string | null;
    readonly eventSessionId?: string | null;
    readonly scannedByUserId?: string | null;
    readonly scannerDeviceId?: string | null;
    readonly result: CheckinResult;
    readonly rejectionReason?: CheckinRejectionReason | null;
    readonly scannedAt: Date;

    constructor(props: CheckinProps) {
        super(props);
        this.ticketId = props.ticketId;
        this.eventSessionId = props.eventSessionId;
        this.scannedByUserId = props.scannedByUserId;
        this.scannerDeviceId = props.scannerDeviceId;
        this.result = props.result;
        this.rejectionReason = props.rejectionReason;
        this.scannedAt = props.scannedAt;
    }
}
