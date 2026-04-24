import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository';
import { UpsertCategoryDto } from '../dto/upsert-category.dto';

export class UpdateCategoryUseCase {
    constructor(private readonly repo: ICategoryRepository) {}

    async execute(
        id: string,
        dto: Partial<UpsertCategoryDto>,
    ): Promise<CategoryEntity> {
        const current = await this.repo.findById(id);
        if (!current) throw new NotFoundDomainException('Category not found');
        const next = new CategoryEntity({
            id: current.id,
            createdAt: current.createdAt,
            name: dto.name ?? current.name,
            slug: dto.slug ?? current.slug,
            icon: dto.icon ?? current.icon,
            sortOrder: dto.sortOrder ?? current.sortOrder,
            isActive: dto.isActive ?? current.isActive,
            updatedAt: new Date(),
        });
        return this.repo.update(next);
    }
}
