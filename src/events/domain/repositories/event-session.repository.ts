import { EventSessionEntity } from '../entities/event-session.entity';

export interface IEventSessionRepository {
    findById(id: string): Promise<EventSessionEntity | null>;
    findByEvent(eventId: string): Promise<EventSessionEntity[]>;
    create(entity: EventSessionEntity): Promise<EventSessionEntity>;
    update(entity: EventSessionEntity): Promise<EventSessionEntity>;
    delete(id: string): Promise<void>;
}
