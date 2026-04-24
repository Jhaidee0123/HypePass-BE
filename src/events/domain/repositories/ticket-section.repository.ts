import { TicketSectionEntity } from '../entities/ticket-section.entity';

export interface ITicketSectionRepository {
    findById(id: string): Promise<TicketSectionEntity | null>;
    findByEventSession(
        eventSessionId: string,
    ): Promise<TicketSectionEntity[]>;
    create(entity: TicketSectionEntity): Promise<TicketSectionEntity>;
    update(entity: TicketSectionEntity): Promise<TicketSectionEntity>;
    delete(id: string): Promise<void>;
}
