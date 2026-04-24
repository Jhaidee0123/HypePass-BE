import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { TicketSectionProps } from '../types/ticket-section.props';
import { TicketSectionStatus } from '../types/ticket-section-status';

export class TicketSectionEntity extends BaseEntity {
    readonly eventSessionId: string;
    readonly name: string;
    readonly description?: string | null;
    readonly totalInventory: number;
    readonly minPerOrder: number;
    readonly maxPerOrder: number;
    readonly resaleAllowed: boolean;
    readonly transferAllowed: boolean;
    readonly status: TicketSectionStatus;
    readonly sortOrder: number;

    constructor(props: TicketSectionProps) {
        super(props);
        this.eventSessionId = props.eventSessionId;
        this.name = props.name;
        this.description = props.description;
        this.totalInventory = props.totalInventory;
        this.minPerOrder = props.minPerOrder;
        this.maxPerOrder = props.maxPerOrder;
        this.resaleAllowed = props.resaleAllowed;
        this.transferAllowed = props.transferAllowed;
        this.status = props.status;
        this.sortOrder = props.sortOrder;
    }
}
