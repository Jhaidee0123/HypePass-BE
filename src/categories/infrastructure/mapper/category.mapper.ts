import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from '../orm/category.orm.entity';

export class CategoryMapper {
    static toDomain(orm: CategoryOrmEntity): CategoryEntity {
        return new CategoryEntity({
            id: orm.id,
            name: orm.name,
            slug: orm.slug,
            icon: orm.icon,
            sortOrder: orm.sortOrder,
            isActive: orm.isActive,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: CategoryEntity): Partial<CategoryOrmEntity> {
        return {
            id: entity.id,
            name: entity.name,
            slug: entity.slug,
            icon: entity.icon ?? null,
            sortOrder: entity.sortOrder,
            isActive: entity.isActive,
        };
    }
}
