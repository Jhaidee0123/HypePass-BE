import { CategoryEntity } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository';

export class ListCategoriesUseCase {
    constructor(private readonly repo: ICategoryRepository) {}

    execute(includeInactive = false): Promise<CategoryEntity[]> {
        return this.repo.findAll(includeInactive);
    }
}
