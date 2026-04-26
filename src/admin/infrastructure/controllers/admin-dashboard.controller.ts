import { Controller, Get, Inject } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../auth/constants';
import { GetAdminDashboardUseCase } from '../../application/use-case/get-dashboard.usecase';
import { get_admin_dashboard_usecase_token } from '../tokens/admin.tokens';

@ApiTags('Admin — Dashboard')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/dashboard')
export class AdminDashboardController {
    constructor(
        @Inject(get_admin_dashboard_usecase_token)
        private readonly getDashboard: GetAdminDashboardUseCase,
    ) {}

    @Get()
    get() {
        return this.getDashboard.execute();
    }
}
