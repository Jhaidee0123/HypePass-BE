import { TicketQrTokenEntity } from '../entities/ticket-qr-token.entity';

export interface ITicketQrTokenRepository {
    findActiveByTicket(
        ticketId: string,
    ): Promise<TicketQrTokenEntity | null>;
    create(entity: TicketQrTokenEntity): Promise<TicketQrTokenEntity>;
    deactivateAllForTicket(ticketId: string): Promise<void>;
}
