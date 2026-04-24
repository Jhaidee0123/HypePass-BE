import { BaseProps } from '../../../shared/domain/types/base.props';
import { TicketTransferStatus } from './ticket-transfer-status';

export type TicketTransferProps = BaseProps & {
    ticketId: string;
    fromUserId: string;
    toUserId: string;
    status: TicketTransferStatus;
    note?: string | null;
    initiatedAt: Date;
    completedAt?: Date | null;
    expiresAt?: Date | null;
    /** Snapshot of ownership/qr versions AFTER the transfer completed. */
    resultingOwnershipVersion?: number | null;
    resultingQrGenerationVersion?: number | null;
};
