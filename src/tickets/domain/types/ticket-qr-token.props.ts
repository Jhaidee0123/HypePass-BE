import { BaseProps } from '../../../shared/domain/types/base.props';
import { QrTokenReason } from './qr-token-reason';

export type TicketQrTokenProps = BaseProps & {
    ticketId: string;
    tokenHash: string;
    tokenVersion: number;
    validFrom: Date;
    validUntil?: Date | null;
    isActive: boolean;
    generatedReason: QrTokenReason;
};
