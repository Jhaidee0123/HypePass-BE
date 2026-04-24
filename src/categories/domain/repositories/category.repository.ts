import { CategoryEntity } from '../entities/category.entity';

export interface ICategoryRepository {
    findAll(includeInactive?: boolean): Promise<CategoryEntity[]>;
    findById(id: string): Promise<CategoryEntity | null>;
    findBySlug(slug: string): Promise<CategoryEntity | null>;
    create(entity: CategoryEntity): Promise<CategoryEntity>;
    update(entity: CategoryEntity): Promise<CategoryEntity>;
    delete(id: string): Promise<void>;
}
