import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrmEntity } from '../../infrastructure/orm/payment.orm.entity';
import { PaymentMapper } from '../../infrastructure/mapper/payment.mapper';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/repositories/payment.repository';

@Injectable()
export class PaymentService implements IPaymentRepository {
    constructor(
        @InjectRepository(PaymentOrmEntity)
        private readonly repo: Repository<PaymentOrmEntity>,
    ) {}

    async findById(id: string): Promise<PaymentEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? PaymentMapper.toDomain(row) : null;
    }

    async findByOrder(orderId: string): Promise<PaymentEntity | null> {
        const row = await this.repo.findOne({ where: { orderId } });
        return row ? PaymentMapper.toDomain(row) : null;
    }

    async findByReference(reference: string): Promise<PaymentEntity | null> {
        const row = await this.repo.findOne({
            where: { providerReference: reference },
        });
        return row ? PaymentMapper.toDomain(row) : null;
    }

    async create(entity: PaymentEntity): Promise<PaymentEntity> {
        const row = this.repo.create(PaymentMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return PaymentMapper.toDomain(saved);
    }

    async update(entity: PaymentEntity): Promise<PaymentEntity> {
        await this.repo.update(entity.id, PaymentMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return PaymentMapper.toDomain(updated);
    }
}
