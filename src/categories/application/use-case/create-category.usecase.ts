import { ConflictDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository';
import { UpsertCategoryDto } from '../dto/upsert-category.dto';

export class CreateCategoryUseCase {
    constructor(private readonly repo: ICategoryRepository) {}

    async execute(dto: UpsertCategoryDto): Promise<CategoryEntity> {
        const existing = await this.repo.findBySlug(dto.slug);
        if (existing) {
            throw new ConflictDomainException(
                `Category slug "${dto.slug}" already exists`,
                'CATEGORY_SLUG_TAKEN',
            );
        }
        const entity = new CategoryEntity({
            name: dto.name,
            slug: dto.slug,
            icon: dto.icon ?? null,
            sortOrder: dto.sortOrder ?? 0,
            isActive: dto.isActive ?? true,
        });
        return this.repo.create(entity);
    }
}
