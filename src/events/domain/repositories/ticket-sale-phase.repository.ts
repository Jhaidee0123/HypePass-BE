import { TicketSalePhaseEntity } from '../entities/ticket-sale-phase.entity';

export interface ITicketSalePhaseRepository {
    findById(id: string): Promise<TicketSalePhaseEntity | null>;
    findBySection(ticketSectionId: string): Promise<TicketSalePhaseEntity[]>;
    create(entity: TicketSalePhaseEntity): Promise<TicketSalePhaseEntity>;
    update(entity: TicketSalePhaseEntity): Promise<TicketSalePhaseEntity>;
    delete(id: string): Promise<void>;
}
