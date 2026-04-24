import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemOrmEntity } from '../../infrastructure/orm/order-item.orm.entity';
import { OrderItemMapper } from '../../infrastructure/mapper/order-item.mapper';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import { IOrderItemRepository } from '../../domain/repositories/order-item.repository';

@Injectable()
export class OrderItemService implements IOrderItemRepository {
    constructor(
        @InjectRepository(OrderItemOrmEntity)
        private readonly repo: Repository<OrderItemOrmEntity>,
    ) {}

    async findByOrder(orderId: string): Promise<OrderItemEntity[]> {
        const rows = await this.repo.find({
            where: { orderId },
            order: { createdAt: 'ASC' },
        });
        return rows.map(OrderItemMapper.toDomain);
    }

    async create(entity: OrderItemEntity): Promise<OrderItemEntity> {
        const row = this.repo.create(OrderItemMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return OrderItemMapper.toDomain(saved);
    }
}
