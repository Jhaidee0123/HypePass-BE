import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { TicketTransferProps } from '../types/ticket-transfer.props';
import { TicketTransferStatus } from '../types/ticket-transfer-status';

export class TicketTransferEntity extends BaseEntity {
    readonly ticketId: string;
    readonly fromUserId: string;
    readonly toUserId: string;
    readonly status: TicketTransferStatus;
    readonly note?: string | null;
    readonly initiatedAt: Date;
    readonly completedAt?: Date | null;
    readonly expiresAt?: Date | null;
    readonly resultingOwnershipVersion?: number | null;
    readonly resultingQrGenerationVersion?: number | null;

    constructor(props: TicketTransferProps) {
        super(props);
        this.ticketId = props.ticketId;
        this.fromUserId = props.fromUserId;
        this.toUserId = props.toUserId;
        this.status = props.status;
        this.note = props.note;
        this.initiatedAt = props.initiatedAt;
        this.completedAt = props.completedAt;
        this.expiresAt = props.expiresAt;
        this.resultingOwnershipVersion = props.resultingOwnershipVersion;
        this.resultingQrGenerationVersion = props.resultingQrGenerationVersion;
    }
}
