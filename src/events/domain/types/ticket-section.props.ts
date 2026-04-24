import { BaseProps } from '../../../shared/domain/types/base.props';
import { TicketSectionStatus } from './ticket-section-status';

export type TicketSectionProps = BaseProps & {
    eventSessionId: string;
    name: string;
    description?: string | null;
    totalInventory: number;
    minPerOrder: number;
    maxPerOrder: number;
    resaleAllowed: boolean;
    transferAllowed: boolean;
    status: TicketSectionStatus;
    sortOrder: number;
};
