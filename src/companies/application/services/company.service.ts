import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CompanyOrmEntity } from '../../infrastructure/orm/company.orm.entity';
import { CompanyMapper } from '../../infrastructure/mapper/company.mapper';
import { CompanyEntity } from '../../domain/entities/company.entity';
import { ICompanyRepository } from '../../domain/repositories/company.repository';
import { CompanyQueryFilter } from '../../domain/types/company-query-filter';

@Injectable()
export class CompanyService implements ICompanyRepository {
    constructor(
        @InjectRepository(CompanyOrmEntity)
        private readonly repo: Repository<CompanyOrmEntity>,
    ) {}

    async findAll(query?: CompanyQueryFilter): Promise<CompanyEntity[]> {
        const where: Record<string, unknown> = {};
        if (query?.status) where.status = query.status;
        if (query?.slug) where.slug = query.slug;
        if (query?.search) where.name = ILike(`%${query.search}%`);
        const rows = await this.repo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        return rows.map(CompanyMapper.toDomain);
    }

    async findById(id: string): Promise<CompanyEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? CompanyMapper.toDomain(row) : null;
    }

    async findBySlug(slug: string): Promise<CompanyEntity | null> {
        const row = await this.repo.findOne({ where: { slug } });
        return row ? CompanyMapper.toDomain(row) : null;
    }

    async create(entity: CompanyEntity): Promise<CompanyEntity> {
        const row = this.repo.create(CompanyMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return CompanyMapper.toDomain(saved);
    }

    async update(entity: CompanyEntity): Promise<CompanyEntity> {
        await this.repo.update(entity.id, CompanyMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return CompanyMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
