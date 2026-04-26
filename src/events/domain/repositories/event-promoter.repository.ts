import { EventPromoterEntity } from '../entities/event-promoter.entity';

export interface IEventPromoterRepository {
    findById(id: string): Promise<EventPromoterEntity | null>;
    findByEvent(eventId: string): Promise<EventPromoterEntity[]>;
    findActiveByEvent(eventId: string): Promise<EventPromoterEntity[]>;
    findActiveByEventAndCode(
        eventId: string,
        referralCode: string,
    ): Promise<EventPromoterEntity | null>;
    findActiveByEventAndUser(
        eventId: string,
        userId: string,
    ): Promise<EventPromoterEntity | null>;
    findActiveByUser(userId: string): Promise<EventPromoterEntity[]>;
    findHistoricalByUser(userId: string): Promise<EventPromoterEntity[]>;
    isCodeAvailable(eventId: string, referralCode: string): Promise<boolean>;
    create(entity: EventPromoterEntity): Promise<EventPromoterEntity>;
    update(entity: EventPromoterEntity): Promise<EventPromoterEntity>;
}
