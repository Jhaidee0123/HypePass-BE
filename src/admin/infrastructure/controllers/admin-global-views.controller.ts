import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, SYSTEM_ROLES } from '../../../auth';
import { GetGlobalViewsUseCase } from '../../application/use-case/get-global-views.usecase';
import { get_global_views_usecase_token } from '../tokens/admin.tokens';

@ApiTags('Admin — Global views')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/global')
export class AdminGlobalViewsController {
    constructor(
        @Inject(get_global_views_usecase_token)
        private readonly views: GetGlobalViewsUseCase,
    ) {}

    @Get('courtesies')
    courtesies(@Query('limit') limit?: string) {
        return this.views.listCourtesies(limit ? Number(limit) : 200);
    }

    @Get('staff')
    staff(@Query('limit') limit?: string) {
        return this.views.listStaffAssignments(limit ? Number(limit) : 300);
    }
}
