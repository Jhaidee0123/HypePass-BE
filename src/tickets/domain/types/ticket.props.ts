import { BaseProps } from '../../../shared/domain/types/base.props';
import { TicketStatus } from './ticket-status';

export type TicketProps = BaseProps & {
    orderItemId: string;
    originalOrderId: string;
    currentOwnerUserId: string;
    eventId: string;
    eventSessionId: string;
    ticketSectionId: string;
    ticketSalePhaseId?: string | null;
    status: TicketStatus;
    ownershipVersion: number;
    faceValue: number;
    latestSalePrice?: number | null;
    currency: string;
    qrGenerationVersion: number;
    courtesy?: boolean;
};
