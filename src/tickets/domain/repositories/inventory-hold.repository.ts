import { InventoryHoldEntity } from '../entities/inventory-hold.entity';

export type SectionActiveHoldSum = {
    ticketSectionId: string;
    quantity: number;
};

export interface IInventoryHoldRepository {
    findById(id: string): Promise<InventoryHoldEntity | null>;
    findByOrder(orderId: string): Promise<InventoryHoldEntity[]>;
    /**
     * Sum of quantity for all ACTIVE (non-expired) holds for a section.
     * Intended to be called inside a transaction that previously locked
     * the ticket_sections row.
     */
    sumActiveForSection(
        ticketSectionId: string,
        now: Date,
    ): Promise<number>;
    /**
     * Like `sumActiveForSection` but grouped: returns one entry per section
     * with at least one active hold. Used by the sales-summary endpoint.
     */
    sumActiveForSections(
        ticketSectionIds: string[],
        now: Date,
    ): Promise<SectionActiveHoldSum[]>;
    create(entity: InventoryHoldEntity): Promise<InventoryHoldEntity>;
    update(entity: InventoryHoldEntity): Promise<InventoryHoldEntity>;
}
