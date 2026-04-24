import { EventMediaEntity } from '../entities/event-media.entity';

export interface IEventMediaRepository {
    findById(id: string): Promise<EventMediaEntity | null>;
    findByEvent(eventId: string): Promise<EventMediaEntity[]>;
    create(entity: EventMediaEntity): Promise<EventMediaEntity>;
    delete(id: string): Promise<void>;
}
