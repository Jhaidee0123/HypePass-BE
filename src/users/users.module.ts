import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/orm/user.orm.entity';
import { UserService } from './application/services/user.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import {
    get_me_usecase_token,
    list_users_usecase_token,
    user_service_token,
} from './infrastructure/tokens/users.tokens';
import { GetMeUseCase } from './application/use-case/get-me.usecase';
import { ListUsersUseCase } from './application/use-case/list-users.usecase';

@Module({
    imports: [TypeOrmModule.forFeature([UserOrmEntity])],
    providers: [
        { provide: user_service_token, useClass: UserService },
        {
            provide: get_me_usecase_token,
            useFactory: (svc: UserService) => new GetMeUseCase(svc),
            inject: [user_service_token],
        },
        {
            provide: list_users_usecase_token,
            useFactory: (svc: UserService) => new ListUsersUseCase(svc),
            inject: [user_service_token],
        },
    ],
    controllers: [UsersController],
    exports: [user_service_token, TypeOrmModule],
})
export class UsersModule {}
