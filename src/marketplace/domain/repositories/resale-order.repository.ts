import { ResaleOrderEntity } from '../entities/resale-order.entity';

export interface IResaleOrderRepository {
    findById(id: string): Promise<ResaleOrderEntity | null>;
    findByOrder(orderId: string): Promise<ResaleOrderEntity | null>;
    findByListing(listingId: string): Promise<ResaleOrderEntity[]>;
    create(entity: ResaleOrderEntity): Promise<ResaleOrderEntity>;
    update(entity: ResaleOrderEntity): Promise<ResaleOrderEntity>;
}
