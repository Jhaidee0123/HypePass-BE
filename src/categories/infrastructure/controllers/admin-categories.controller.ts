import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators';
import { SYSTEM_ROLES } from '../../../auth';
import { UpsertCategoryDto } from '../../application/dto/upsert-category.dto';
import {
    create_category_usecase_token,
    delete_category_usecase_token,
    update_category_usecase_token,
} from '../tokens/categories.tokens';
import { CreateCategoryUseCase } from '../../application/use-case/create-category.usecase';
import { UpdateCategoryUseCase } from '../../application/use-case/update-category.usecase';
import { DeleteCategoryUseCase } from '../../application/use-case/delete-category.usecase';

@ApiTags('Admin — Categories')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/categories')
export class AdminCategoriesController {
    constructor(
        @Inject(create_category_usecase_token)
        private readonly createCategory: CreateCategoryUseCase,
        @Inject(update_category_usecase_token)
        private readonly updateCategory: UpdateCategoryUseCase,
        @Inject(delete_category_usecase_token)
        private readonly deleteCategory: DeleteCategoryUseCase,
    ) {}

    @Post()
    create(@Body() dto: UpsertCategoryDto) {
        return this.createCategory.execute(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<UpsertCategoryDto>) {
        return this.updateCategory.execute(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.deleteCategory.execute(id);
    }
}
