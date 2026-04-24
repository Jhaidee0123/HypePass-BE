import { PaymentEntity } from '../entities/payment.entity';

export interface IPaymentRepository {
    findById(id: string): Promise<PaymentEntity | null>;
    findByOrder(orderId: string): Promise<PaymentEntity | null>;
    findByReference(reference: string): Promise<PaymentEntity | null>;
    create(entity: PaymentEntity): Promise<PaymentEntity>;
    update(entity: PaymentEntity): Promise<PaymentEntity>;
}
