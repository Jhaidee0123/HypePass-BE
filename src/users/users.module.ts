import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/orm/user.orm.entity';
import { UserService } from './application/services/user.service';
import { AdminUserService } from './application/services/admin-user.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { AdminUsersController } from './infrastructure/controllers/admin-users.controller';
import {
    admin_ban_user_usecase_token,
    admin_delete_user_usecase_token,
    admin_list_users_usecase_token,
    admin_send_password_reset_usecase_token,
    admin_set_user_role_usecase_token,
    admin_unban_user_usecase_token,
    admin_user_service_token,
    get_me_usecase_token,
    list_users_usecase_token,
    user_service_token,
} from './infrastructure/tokens/users.tokens';
import { GetMeUseCase } from './application/use-case/get-me.usecase';
import { ListUsersUseCase } from './application/use-case/list-users.usecase';
import { AdminListUsersUseCase } from './application/use-case/admin-list-users.usecase';
import { AdminSetUserRoleUseCase } from './application/use-case/admin-set-user-role.usecase';
import {
    AdminBanUserUseCase,
    AdminUnbanUserUseCase,
} from './application/use-case/admin-ban-user.usecase';
import { AdminDeleteUserUseCase } from './application/use-case/admin-delete-user.usecase';
import { AdminSendPasswordResetUseCase } from './application/use-case/admin-send-password-reset.usecase';
import { AuditLogService } from '../audit/application/services/audit-log.service';
import { BETTER_AUTH } from '../auth/constants';

@Module({
    imports: [TypeOrmModule.forFeature([UserOrmEntity])],
    providers: [
        { provide: user_service_token, useClass: UserService },
        { provide: admin_user_service_token, useClass: AdminUserService },
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
        {
            provide: admin_list_users_usecase_token,
            useFactory: (svc: AdminUserService) => new AdminListUsersUseCase(svc),
            inject: [admin_user_service_token],
        },
        {
            provide: admin_set_user_role_usecase_token,
            useFactory: (svc: AdminUserService, audit: AuditLogService) =>
                new AdminSetUserRoleUseCase(svc, audit),
            inject: [admin_user_service_token, AuditLogService],
        },
        {
            provide: admin_ban_user_usecase_token,
            useFactory: (svc: AdminUserService, audit: AuditLogService) =>
                new AdminBanUserUseCase(svc, audit),
            inject: [admin_user_service_token, AuditLogService],
        },
        {
            provide: admin_unban_user_usecase_token,
            useFactory: (svc: AdminUserService, audit: AuditLogService) =>
                new AdminUnbanUserUseCase(svc, audit),
            inject: [admin_user_service_token, AuditLogService],
        },
        {
            provide: admin_delete_user_usecase_token,
            useFactory: (svc: AdminUserService, audit: AuditLogService) =>
                new AdminDeleteUserUseCase(svc, audit),
            inject: [admin_user_service_token, AuditLogService],
        },
        {
            provide: admin_send_password_reset_usecase_token,
            useFactory: (
                svc: AdminUserService,
                audit: AuditLogService,
                auth: any,
            ) => new AdminSendPasswordResetUseCase(svc, audit, auth),
            inject: [admin_user_service_token, AuditLogService, BETTER_AUTH],
        },
    ],
    controllers: [UsersController, AdminUsersController],
    exports: [user_service_token, TypeOrmModule],
})
export class UsersModule {}
