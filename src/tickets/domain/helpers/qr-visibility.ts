import { EventEntity } from '../../../events/domain/entities/event.entity';
import { EventSessionEntity } from '../../../events/domain/entities/event-session.entity';

/**
 * Returns the moment at which the QR becomes visible for a given session.
 * Priority: session.qrVisibleFrom → session.startsAt − event.defaultQrVisibleHoursBefore
 *         → session.startsAt − platformDefaultHours.
 */
export function computeQrVisibleFrom(
    session: EventSessionEntity,
    event: EventEntity,
    platformDefaultHoursBefore: number,
): Date {
    if (session.qrVisibleFrom) return session.qrVisibleFrom;

    const hours =
        event.defaultQrVisibleHoursBefore ?? platformDefaultHoursBefore;
    const ms = hours * 60 * 60 * 1000;
    return new Date(session.startsAt.getTime() - ms);
}
