import { TicketEntity } from '../entities/ticket.entity';
import { TicketStatus } from '../types/ticket-status';

export type TicketSectionStatusBreakdown = {
    ticketSectionId: string;
    status: TicketStatus;
    courtesy: boolean;
    count: number;
    faceValueSum: number;
};

export interface ITicketRepository {
    findById(id: string): Promise<TicketEntity | null>;
    findByOwner(userId: string): Promise<TicketEntity[]>;
    findByOrder(orderId: string): Promise<TicketEntity[]>;
    countBySectionAndStatus(
        ticketSectionId: string,
        statuses: TicketStatus[],
    ): Promise<number>;
    /**
     * Groups tickets by `(ticket_section_id, status)` returning counts and the
     * sum of `face_value`. Used by the sales-summary endpoint to avoid N+1s
     * when a single event can contain many sections.
     */
    groupBySectionAndStatus(
        ticketSectionIds: string[],
    ): Promise<TicketSectionStatusBreakdown[]>;
    create(entity: TicketEntity): Promise<TicketEntity>;
    update(entity: TicketEntity): Promise<TicketEntity>;
}
