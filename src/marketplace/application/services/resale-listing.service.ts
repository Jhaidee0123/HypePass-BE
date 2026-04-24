import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ResaleListingOrmEntity } from '../../infrastructure/orm/resale-listing.orm.entity';
import { ResaleListingMapper } from '../../infrastructure/mapper/resale-listing.mapper';
import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';

@Injectable()
export class ResaleListingService implements IResaleListingRepository {
    constructor(
        @InjectRepository(ResaleListingOrmEntity)
        private readonly repo: Repository<ResaleListingOrmEntity>,
    ) {}

    async findById(id: string): Promise<ResaleListingEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? ResaleListingMapper.toDomain(row) : null;
    }

    async findByTicket(ticketId: string): Promise<ResaleListingEntity[]> {
        const rows = await this.repo.find({
            where: { ticketId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(ResaleListingMapper.toDomain);
    }

    async findActiveByTicket(
        ticketId: string,
    ): Promise<ResaleListingEntity | null> {
        const row = await this.repo.findOne({
            where: {
                ticketId,
                status: In([
                    ResaleListingStatus.ACTIVE,
                    ResaleListingStatus.RESERVED,
                ]),
            },
        });
        return row ? ResaleListingMapper.toDomain(row) : null;
    }

    async findBySeller(userId: string): Promise<ResaleListingEntity[]> {
        const rows = await this.repo.find({
            where: { sellerUserId: userId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(ResaleListingMapper.toDomain);
    }

    async findByStatuses(
        statuses: ResaleListingStatus[],
    ): Promise<ResaleListingEntity[]> {
        const rows = await this.repo.find({
            where: { status: In(statuses) },
            order: { createdAt: 'DESC' },
        });
        return rows.map(ResaleListingMapper.toDomain);
    }

    async create(entity: ResaleListingEntity): Promise<ResaleListingEntity> {
        const row = this.repo.create(ResaleListingMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return ResaleListingMapper.toDomain(saved);
    }

    async update(entity: ResaleListingEntity): Promise<ResaleListingEntity> {
        await this.repo.update(
            entity.id,
            ResaleListingMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return ResaleListingMapper.toDomain(updated);
    }
}
