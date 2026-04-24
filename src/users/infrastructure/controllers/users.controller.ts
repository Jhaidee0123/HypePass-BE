import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session } from '../../../auth/decorators';
import { SYSTEM_ROLES, UserSession } from '../../../auth';
import {
    get_me_usecase_token,
    list_users_usecase_token,
} from '../tokens/users.tokens';
import { GetMeUseCase } from '../../application/use-case/get-me.usecase';
import { ListUsersUseCase } from '../../application/use-case/list-users.usecase';

@ApiTags('Users')
@ApiCookieAuth()
@Controller('users')
export class UsersController {
    constructor(
        @Inject(get_me_usecase_token) private readonly getMe: GetMeUseCase,
        @Inject(list_users_usecase_token)
        private readonly listUsers: ListUsersUseCase,
    ) {}

    @Get('me')
    async me(@Session() session: UserSession) {
        return this.getMe.execute(session.user.id);
    }

    @Get()
    @Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
    async list(@Query('role') role?: string, @Query('email') email?: string) {
        return this.listUsers.execute({ role, email });
    }
}
