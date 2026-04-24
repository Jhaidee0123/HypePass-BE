import { ResaleListingEntity } from '../entities/resale-listing.entity';
import { ResaleListingStatus } from '../types/resale-listing-status';

export interface IResaleListingRepository {
    findById(id: string): Promise<ResaleListingEntity | null>;
    findByTicket(ticketId: string): Promise<ResaleListingEntity[]>;
    findActiveByTicket(
        ticketId: string,
    ): Promise<ResaleListingEntity | null>;
    findBySeller(userId: string): Promise<ResaleListingEntity[]>;
    findByStatuses(
        statuses: ResaleListingStatus[],
    ): Promise<ResaleListingEntity[]>;
    create(entity: ResaleListingEntity): Promise<ResaleListingEntity>;
    update(entity: ResaleListingEntity): Promise<ResaleListingEntity>;
}
