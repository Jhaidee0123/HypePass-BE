import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../auth/constants';
import { ListAuditLogsUseCase } from '../../application/use-case/list-audit-logs.usecase';
import { ListAuditLogsQueryDto } from '../../application/dto/list-audit-logs.dto';
import { list_audit_logs_usecase_token } from '../tokens/audit.tokens';

@ApiTags('Admin — Audit logs')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
    constructor(
        @Inject(list_audit_logs_usecase_token)
        private readonly listLogs: ListAuditLogsUseCase,
    ) {}

    @Get()
    list(@Query() query: ListAuditLogsQueryDto) {
        return this.listLogs.execute(query);
    }
}
