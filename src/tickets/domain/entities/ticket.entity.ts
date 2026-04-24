import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { TicketProps } from '../types/ticket.props';
import { TicketStatus } from '../types/ticket-status';

export class TicketEntity extends BaseEntity {
    readonly orderItemId: string;
    readonly originalOrderId: string;
    readonly currentOwnerUserId: string;
    readonly eventId: string;
    readonly eventSessionId: string;
    readonly ticketSectionId: string;
    readonly ticketSalePhaseId?: string | null;
    readonly status: TicketStatus;
    readonly ownershipVersion: number;
    readonly faceValue: number;
    readonly latestSalePrice?: number | null;
    readonly currency: string;
    readonly qrGenerationVersion: number;
    readonly courtesy: boolean;

    constructor(props: TicketProps) {
        super(props);
        this.orderItemId = props.orderItemId;
        this.originalOrderId = props.originalOrderId;
        this.currentOwnerUserId = props.currentOwnerUserId;
        this.eventId = props.eventId;
        this.eventSessionId = props.eventSessionId;
        this.ticketSectionId = props.ticketSectionId;
        this.ticketSalePhaseId = props.ticketSalePhaseId;
        this.status = props.status;
        this.ownershipVersion = props.ownershipVersion;
        this.faceValue = props.faceValue;
        this.latestSalePrice = props.latestSalePrice;
        this.currency = props.currency;
        this.qrGenerationVersion = props.qrGenerationVersion;
        this.courtesy = props.courtesy ?? false;
    }
}
