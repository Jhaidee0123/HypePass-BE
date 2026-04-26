import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../auth/constants';
import { GetSystemLogsUseCase } from '../../application/use-case/get-system-logs.usecase';
import { get_system_logs_usecase_token } from '../tokens/admin.tokens';
import { SystemLogsQuery } from '../streams/log-buffer';

@ApiTags('Admin — System logs')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/system-logs')
export class AdminSystemLogsController {
    constructor(
        @Inject(get_system_logs_usecase_token)
        private readonly getLogs: GetSystemLogsUseCase,
    ) {}

    @Get()
    @ApiQuery({ name: 'level', required: false, enum: ['debug', 'info', 'warn', 'error'] })
    @ApiQuery({ name: 'contains', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    list(
        @Query('level') level?: SystemLogsQuery['level'],
        @Query('contains') contains?: string,
        @Query('limit') limit?: string,
    ) {
        return this.getLogs.execute({
            level,
            contains,
            limit: limit ? Math.max(1, Math.min(1000, Number(limit))) : undefined,
        });
    }
}
