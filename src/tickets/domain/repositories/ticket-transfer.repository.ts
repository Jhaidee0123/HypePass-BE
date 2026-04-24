import { TicketTransferEntity } from '../entities/ticket-transfer.entity';

export interface ITicketTransferRepository {
    findById(id: string): Promise<TicketTransferEntity | null>;
    findByTicket(ticketId: string): Promise<TicketTransferEntity[]>;
    findSentByUser(userId: string): Promise<TicketTransferEntity[]>;
    findReceivedByUser(userId: string): Promise<TicketTransferEntity[]>;
    create(entity: TicketTransferEntity): Promise<TicketTransferEntity>;
}
