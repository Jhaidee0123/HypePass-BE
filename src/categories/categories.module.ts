import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryOrmEntity } from './infrastructure/orm/category.orm.entity';
import { CategoryService } from './application/services/category.service';
import { CategoriesController } from './infrastructure/controllers/categories.controller';
import { AdminCategoriesController } from './infrastructure/controllers/admin-categories.controller';
import {
    category_service_token,
    create_category_usecase_token,
    delete_category_usecase_token,
    list_categories_usecase_token,
    update_category_usecase_token,
} from './infrastructure/tokens/categories.tokens';
import { ListCategoriesUseCase } from './application/use-case/list-categories.usecase';
import { CreateCategoryUseCase } from './application/use-case/create-category.usecase';
import { UpdateCategoryUseCase } from './application/use-case/update-category.usecase';
import { DeleteCategoryUseCase } from './application/use-case/delete-category.usecase';

@Module({
    imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
    providers: [
        { provide: category_service_token, useClass: CategoryService },
        {
            provide: list_categories_usecase_token,
            useFactory: (s: CategoryService) => new ListCategoriesUseCase(s),
            inject: [category_service_token],
        },
        {
            provide: create_category_usecase_token,
            useFactory: (s: CategoryService) => new CreateCategoryUseCase(s),
            inject: [category_service_token],
        },
        {
            provide: update_category_usecase_token,
            useFactory: (s: CategoryService) => new UpdateCategoryUseCase(s),
            inject: [category_service_token],
        },
        {
            provide: delete_category_usecase_token,
            useFactory: (s: CategoryService) => new DeleteCategoryUseCase(s),
            inject: [category_service_token],
        },
    ],
    controllers: [CategoriesController, AdminCategoriesController],
    exports: [category_service_token],
})
export class CategoriesModule {}
