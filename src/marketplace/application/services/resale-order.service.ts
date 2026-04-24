import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResaleOrderOrmEntity } from '../../infrastructure/orm/resale-order.orm.entity';
import { ResaleOrderMapper } from '../../infrastructure/mapper/resale-order.mapper';
import { ResaleOrderEntity } from '../../domain/entities/resale-order.entity';
import { IResaleOrderRepository } from '../../domain/repositories/resale-order.repository';

@Injectable()
export class ResaleOrderService implements IResaleOrderRepository {
    constructor(
        @InjectRepository(ResaleOrderOrmEntity)
        private readonly repo: Repository<ResaleOrderOrmEntity>,
    ) {}

    async findById(id: string): Promise<ResaleOrderEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? ResaleOrderMapper.toDomain(row) : null;
    }

    async findByOrder(orderId: string): Promise<ResaleOrderEntity | null> {
        const row = await this.repo.findOne({ where: { orderId } });
        return row ? ResaleOrderMapper.toDomain(row) : null;
    }

    async findByListing(listingId: string): Promise<ResaleOrderEntity[]> {
        const rows = await this.repo.find({
            where: { resaleListingId: listingId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(ResaleOrderMapper.toDomain);
    }

    async create(entity: ResaleOrderEntity): Promise<ResaleOrderEntity> {
        const row = this.repo.create(ResaleOrderMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return ResaleOrderMapper.toDomain(saved);
    }

    async update(entity: ResaleOrderEntity): Promise<ResaleOrderEntity> {
        await this.repo.update(
            entity.id,
            ResaleOrderMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return ResaleOrderMapper.toDomain(updated);
    }
}
