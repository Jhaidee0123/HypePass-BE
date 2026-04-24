import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { InventoryHoldProps } from '../types/inventory-hold.props';
import { InventoryHoldStatus } from '../types/inventory-hold-status';

export class InventoryHoldEntity extends BaseEntity {
    readonly userId: string;
    readonly eventSessionId: string;
    readonly ticketSectionId: string;
    readonly ticketSalePhaseId: string;
    readonly quantity: number;
    readonly status: InventoryHoldStatus;
    readonly expiresAt: Date;
    readonly orderId?: string | null;

    constructor(props: InventoryHoldProps) {
        super(props);
        this.userId = props.userId;
        this.eventSessionId = props.eventSessionId;
        this.ticketSectionId = props.ticketSectionId;
        this.ticketSalePhaseId = props.ticketSalePhaseId;
        this.quantity = props.quantity;
        this.status = props.status;
        this.expiresAt = props.expiresAt;
        this.orderId = props.orderId;
    }
}
