import { OrderItemEntity } from '../entities/order-item.entity';

export interface IOrderItemRepository {
    findByOrder(orderId: string): Promise<OrderItemEntity[]>;
    create(entity: OrderItemEntity): Promise<OrderItemEntity>;
}
