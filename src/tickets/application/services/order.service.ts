import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderOrmEntity } from '../../infrastructure/orm/order.orm.entity';
import { OrderMapper } from '../../infrastructure/mapper/order.mapper';
import { OrderEntity } from '../../domain/entities/order.entity';
import { IOrderRepository } from '../../domain/repositories/order.repository';

@Injectable()
export class OrderService implements IOrderRepository {
    constructor(
        @InjectRepository(OrderOrmEntity)
        private readonly repo: Repository<OrderOrmEntity>,
    ) {}

    async findById(id: string): Promise<OrderEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? OrderMapper.toDomain(row) : null;
    }

    async findByPaymentReference(
        reference: string,
    ): Promise<OrderEntity | null> {
        const row = await this.repo.findOne({
            where: { paymentReference: reference },
        });
        return row ? OrderMapper.toDomain(row) : null;
    }

    async findByUser(userId: string): Promise<OrderEntity[]> {
        const rows = await this.repo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(OrderMapper.toDomain);
    }

    async create(entity: OrderEntity): Promise<OrderEntity> {
        const row = this.repo.create(OrderMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return OrderMapper.toDomain(saved);
    }

    async update(entity: OrderEntity): Promise<OrderEntity> {
        await this.repo.update(entity.id, OrderMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return OrderMapper.toDomain(updated);
    }
}
