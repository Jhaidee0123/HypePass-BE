import { OrderEntity } from '../entities/order.entity';

export interface IOrderRepository {
    findById(id: string): Promise<OrderEntity | null>;
    findByPaymentReference(reference: string): Promise<OrderEntity | null>;
    findByUser(userId: string): Promise<OrderEntity[]>;
    create(entity: OrderEntity): Promise<OrderEntity>;
    update(entity: OrderEntity): Promise<OrderEntity>;
}
