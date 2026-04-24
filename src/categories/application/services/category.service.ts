import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryOrmEntity } from '../../infrastructure/orm/category.orm.entity';
import { CategoryMapper } from '../../infrastructure/mapper/category.mapper';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository';

@Injectable()
export class CategoryService implements ICategoryRepository {
    constructor(
        @InjectRepository(CategoryOrmEntity)
        private readonly repo: Repository<CategoryOrmEntity>,
    ) {}

    async findAll(includeInactive = false): Promise<CategoryEntity[]> {
        const rows = await this.repo.find({
            where: includeInactive ? {} : { isActive: true },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
        return rows.map(CategoryMapper.toDomain);
    }

    async findById(id: string): Promise<CategoryEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? CategoryMapper.toDomain(row) : null;
    }

    async findBySlug(slug: string): Promise<CategoryEntity | null> {
        const row = await this.repo.findOne({ where: { slug } });
        return row ? CategoryMapper.toDomain(row) : null;
    }

    async create(entity: CategoryEntity): Promise<CategoryEntity> {
        const row = this.repo.create(CategoryMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return CategoryMapper.toDomain(saved);
    }

    async update(entity: CategoryEntity): Promise<CategoryEntity> {
        await this.repo.update(entity.id, CategoryMapper.toPersistance(entity));
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return CategoryMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
