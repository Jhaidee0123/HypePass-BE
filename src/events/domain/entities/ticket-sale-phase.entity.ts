import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { TicketSalePhaseProps } from '../types/ticket-sale-phase.props';

export class TicketSalePhaseEntity extends BaseEntity {
    readonly ticketSectionId: string;
    readonly name: string;
    readonly startsAt: Date;
    readonly endsAt: Date;
    readonly price: number;
    readonly currency: string;
    readonly serviceFee?: number | null;
    readonly platformFee?: number | null;
    readonly taxAmount?: number | null;
    readonly maxPerOrder?: number | null;
    readonly maxPerUser?: number | null;
    readonly sortOrder: number;
    readonly isActive: boolean;

    constructor(props: TicketSalePhaseProps) {
        super(props);
        this.ticketSectionId = props.ticketSectionId;
        this.name = props.name;
        this.startsAt = props.startsAt;
        this.endsAt = props.endsAt;
        this.price = props.price;
        this.currency = props.currency;
        this.serviceFee = props.serviceFee;
        this.platformFee = props.platformFee;
        this.taxAmount = props.taxAmount;
        this.maxPerOrder = props.maxPerOrder;
        this.maxPerUser = props.maxPerUser;
        this.sortOrder = props.sortOrder;
        this.isActive = props.isActive;
    }

    /**
     * Returns true if this phase covers the given timestamp (within its window
     * and still marked active).
     */
    isOpenAt(now: Date): boolean {
        return (
            this.isActive &&
            this.startsAt.getTime() <= now.getTime() &&
            this.endsAt.getTime() > now.getTime()
        );
    }
}
