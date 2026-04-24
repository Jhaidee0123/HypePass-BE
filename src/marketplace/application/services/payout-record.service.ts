import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayoutRecordOrmEntity } from '../../infrastructure/orm/payout-record.orm.entity';
import { PayoutRecordMapper } from '../../infrastructure/mapper/payout-record.mapper';
import { PayoutRecordEntity } from '../../domain/entities/payout-record.entity';
import {
    IPayoutRecordRepository,
    PayoutRecordFilter,
} from '../../domain/repositories/payout-record.repository';

@Injectable()
export class PayoutRecordService implements IPayoutRecordRepository {
    constructor(
        @InjectRepository(PayoutRecordOrmEntity)
        private readonly repo: Repository<PayoutRecordOrmEntity>,
    ) {}

    async findById(id: string): Promise<PayoutRecordEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? PayoutRecordMapper.toDomain(row) : null;
    }

    async findBySeller(userId: string): Promise<PayoutRecordEntity[]> {
        const rows = await this.repo.find({
            where: { sellerUserId: userId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(PayoutRecordMapper.toDomain);
    }

    async findByListing(listingId: string): Promise<PayoutRecordEntity[]> {
        const rows = await this.repo.find({
            where: { resaleListingId: listingId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(PayoutRecordMapper.toDomain);
    }

    async findAll(
        filter?: PayoutRecordFilter,
    ): Promise<PayoutRecordEntity[]> {
        const where: Record<string, unknown> = {};
        if (filter?.status) where.status = filter.status;
        if (filter?.sellerUserId) where.sellerUserId = filter.sellerUserId;
        const rows = await this.repo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        return rows.map(PayoutRecordMapper.toDomain);
    }

    async create(entity: PayoutRecordEntity): Promise<PayoutRecordEntity> {
        const row = this.repo.create(PayoutRecordMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return PayoutRecordMapper.toDomain(saved);
    }

    async update(entity: PayoutRecordEntity): Promise<PayoutRecordEntity> {
        await this.repo.update(
            entity.id,
            PayoutRecordMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return PayoutRecordMapper.toDomain(updated);
    }
}
