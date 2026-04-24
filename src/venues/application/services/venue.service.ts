import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueOrmEntity } from '../../infrastructure/orm/venue.orm.entity';
import { VenueMapper } from '../../infrastructure/mapper/venue.mapper';
import { VenueEntity } from '../../domain/entities/venue.entity';
import { IVenueRepository } from '../../domain/repositories/venue.repository';
import { VenueQueryFilter } from '../../domain/types/venue-query-filter';

@Injectable()
export class VenueService implements IVenueRepository {
    constructor(
        @InjectRepository(VenueOrmEntity)
        private readonly repo: Repository<VenueOrmEntity>,
    ) {}

    async findAll(query?: VenueQueryFilter): Promise<VenueEntity[]> {
        const rows = await this.repo.find({
            where: query ?? {},
            order: { createdAt: 'DESC' },
        });
        return rows.map(VenueMapper.toDomain);
    }

    async findById(id: string): Promise<VenueEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? VenueMapper.toDomain(row) : null;
    }

    async create(entity: VenueEntity): Promise<VenueEntity> {
        const row = this.repo.create(VenueMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return VenueMapper.toDomain(saved);
    }

    async update(entity: VenueEntity): Promise<VenueEntity> {
        await this.repo.update(entity.id, VenueMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return VenueMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
