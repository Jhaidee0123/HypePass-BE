import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { EventStaffProps } from '../types/event-staff.props';
import { EventStaffRole } from '../types/event-staff-role';

export class EventStaffEntity extends BaseEntity {
    readonly eventId: string;
    readonly userId: string;
    readonly role: EventStaffRole;
    readonly assignedByUserId: string;
    readonly note: string | null;

    constructor(props: EventStaffProps) {
        super(props);
        this.eventId = props.eventId;
        this.userId = props.userId;
        this.role = props.role;
        this.assignedByUserId = props.assignedByUserId;
        this.note = props.note ?? null;
    }
}
