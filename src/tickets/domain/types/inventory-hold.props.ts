import { BaseProps } from '../../../shared/domain/types/base.props';
import { InventoryHoldStatus } from './inventory-hold-status';

export type InventoryHoldProps = BaseProps & {
    userId: string;
    eventSessionId: string;
    ticketSectionId: string;
    ticketSalePhaseId: string;
    quantity: number;
    status: InventoryHoldStatus;
    expiresAt: Date;
    orderId?: string | null;
};
