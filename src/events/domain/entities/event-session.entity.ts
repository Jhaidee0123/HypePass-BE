import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { EventSessionProps } from '../types/event-session.props';
import { EventSessionStatus } from '../types/event-session-status';

export class EventSessionEntity extends BaseEntity {
    readonly eventId: string;
    readonly name?: string | null;
    readonly startsAt: Date;
    readonly endsAt: Date;
    readonly timezone: string;
    readonly salesStartAt?: Date | null;
    readonly salesEndAt?: Date | null;
    readonly doorsOpenAt?: Date | null;
    readonly checkinStartAt?: Date | null;
    readonly transferCutoffAt?: Date | null;
    readonly resaleCutoffAt?: Date | null;
    readonly qrVisibleFrom?: Date | null;
    readonly status: EventSessionStatus;

    constructor(props: EventSessionProps) {
        super(props);
        this.eventId = props.eventId;
        this.name = props.name;
        this.startsAt = props.startsAt;
        this.endsAt = props.endsAt;
        this.timezone = props.timezone;
        this.salesStartAt = props.salesStartAt;
        this.salesEndAt = props.salesEndAt;
        this.doorsOpenAt = props.doorsOpenAt;
        this.checkinStartAt = props.checkinStartAt;
        this.transferCutoffAt = props.transferCutoffAt;
        this.resaleCutoffAt = props.resaleCutoffAt;
        this.qrVisibleFrom = props.qrVisibleFrom;
        this.status = props.status;
    }
}
