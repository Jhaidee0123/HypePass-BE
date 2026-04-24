import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { ICategoryRepository } from '../../domain/repositories/category.repository';

export class DeleteCategoryUseCase {
    constructor(private readonly repo: ICategoryRepository) {}

    async execute(id: string): Promise<void> {
        const current = await this.repo.findById(id);
        if (!current) throw new NotFoundDomainException('Category not found');
        await this.repo.delete(id);
    }
}
