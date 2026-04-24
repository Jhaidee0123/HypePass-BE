import { BaseProps } from '../../../shared/domain/types/base.props';
import { EventSessionStatus } from './event-session-status';

export type EventSessionProps = BaseProps & {
    eventId: string;
    name?: string | null;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    salesStartAt?: Date | null;
    salesEndAt?: Date | null;
    doorsOpenAt?: Date | null;
    checkinStartAt?: Date | null;
    transferCutoffAt?: Date | null;
    resaleCutoffAt?: Date | null;
    qrVisibleFrom?: Date | null;
    status: EventSessionStatus;
};
