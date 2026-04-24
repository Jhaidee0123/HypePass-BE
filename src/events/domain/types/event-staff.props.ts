import { BaseProps } from '../../../shared/domain/types/base.props';
import { EventStaffRole } from './event-staff-role';

export type EventStaffProps = BaseProps & {
    eventId: string;
    userId: string;
    role: EventStaffRole;
    assignedByUserId: string;
    note?: string | null;
};
