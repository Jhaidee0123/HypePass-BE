import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '../../../auth/decorators/allow-anonymous.decorator';
import { list_categories_usecase_token } from '../tokens/categories.tokens';
import { ListCategoriesUseCase } from '../../application/use-case/list-categories.usecase';

@ApiTags('Categories')
@AllowAnonymous()
@Controller('categories')
export class CategoriesController {
    constructor(
        @Inject(list_categories_usecase_token)
        private readonly listCategories: ListCategoriesUseCase,
    ) {}

    @Get()
    list(@Query('includeInactive') includeInactive?: string) {
        return this.listCategories.execute(includeInactive === 'true');
    }
}
