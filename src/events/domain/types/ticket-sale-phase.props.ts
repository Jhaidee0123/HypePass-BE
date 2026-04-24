import { BaseProps } from '../../../shared/domain/types/base.props';

export type TicketSalePhaseProps = BaseProps & {
    ticketSectionId: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
    /** Price in minor units (COP cents). */
    price: number;
    currency: string;
    serviceFee?: number | null;
    platformFee?: number | null;
    taxAmount?: number | null;
    maxPerOrder?: number | null;
    maxPerUser?: number | null;
    sortOrder: number;
    isActive: boolean;
};
