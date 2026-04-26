import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/orm/audit-log.orm.entity';
import { AuditLogService } from './application/services/audit-log.service';
import { ListAuditLogsUseCase } from './application/use-case/list-audit-logs.usecase';
import { AdminAuditLogsController } from './infrastructure/controllers/admin-audit-logs.controller';
import { list_audit_logs_usecase_token } from './infrastructure/tokens/audit.tokens';

/**
 * Cross-cutting audit logging. Marked @Global so feature modules can inject
 * AuditLogService without importing this module explicitly.
 */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
    providers: [
        AuditLogService,
        {
            provide: list_audit_logs_usecase_token,
            useFactory: (svc: AuditLogService) => new ListAuditLogsUseCase(svc),
            inject: [AuditLogService],
        },
    ],
    controllers: [AdminAuditLogsController],
    exports: [AuditLogService, TypeOrmModule],
})
export class AuditModule {}
