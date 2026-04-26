import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session, SYSTEM_ROLES, UserSession } from '../../../auth';
import {
    admin_ban_user_usecase_token,
    admin_delete_user_usecase_token,
    admin_list_users_usecase_token,
    admin_send_password_reset_usecase_token,
    admin_set_user_role_usecase_token,
    admin_unban_user_usecase_token,
    admin_user_service_token,
} from '../tokens/users.tokens';
import { AdminListUsersUseCase } from '../../application/use-case/admin-list-users.usecase';
import { AdminSetUserRoleUseCase } from '../../application/use-case/admin-set-user-role.usecase';
import {
    AdminBanUserUseCase,
    AdminUnbanUserUseCase,
} from '../../application/use-case/admin-ban-user.usecase';
import { AdminDeleteUserUseCase } from '../../application/use-case/admin-delete-user.usecase';
import { AdminSendPasswordResetUseCase } from '../../application/use-case/admin-send-password-reset.usecase';
import { AdminUserService } from '../../application/services/admin-user.service';
import { ListAdminUsersQueryDto } from '../../application/dto/list-admin-users.dto';
import { UpdateUserRoleDto } from '../../application/dto/update-user-role.dto';
import { BanUserDto } from '../../application/dto/ban-user.dto';

@ApiTags('Admin — Users')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/users')
export class AdminUsersController {
    constructor(
        @Inject(admin_list_users_usecase_token)
        private readonly listUsers: AdminListUsersUseCase,
        @Inject(admin_set_user_role_usecase_token)
        private readonly setRole: AdminSetUserRoleUseCase,
        @Inject(admin_ban_user_usecase_token)
        private readonly ban: AdminBanUserUseCase,
        @Inject(admin_unban_user_usecase_token)
        private readonly unban: AdminUnbanUserUseCase,
        @Inject(admin_delete_user_usecase_token)
        private readonly deleteUser: AdminDeleteUserUseCase,
        @Inject(admin_send_password_reset_usecase_token)
        private readonly sendReset: AdminSendPasswordResetUseCase,
        @Inject(admin_user_service_token)
        private readonly users: AdminUserService,
    ) {}

    @Get()
    list(@Query() query: ListAdminUsersQueryDto) {
        return this.listUsers.execute(query);
    }

    @Get(':id')
    detail(@Param('id') id: string) {
        return this.users.getById(id);
    }

    @Patch(':id/role')
    role(
        @Param('id') id: string,
        @Body() body: UpdateUserRoleDto,
        @Session() session: UserSession,
    ) {
        return this.setRole.execute(id, body.role, session.user.id);
    }

    @Post(':id/ban')
    banUser(
        @Param('id') id: string,
        @Body() body: BanUserDto,
        @Session() session: UserSession,
    ) {
        return this.ban.execute(id, body, session.user.id);
    }

    @Post(':id/unban')
    unbanUser(@Param('id') id: string, @Session() session: UserSession) {
        return this.unban.execute(id, session.user.id);
    }

    @Post(':id/send-password-reset')
    sendPasswordReset(
        @Param('id') id: string,
        @Session() session: UserSession,
    ) {
        return this.sendReset.execute(id, session.user.id);
    }

    @Delete(':id')
    softDelete(@Param('id') id: string, @Session() session: UserSession) {
        return this.deleteUser.execute(id, session.user.id);
    }
}
