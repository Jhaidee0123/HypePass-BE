import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/orm/audit-log.orm.entity';
import { AuditLogService } from './application/services/audit-log.service';

/**
 * Cross-cutting audit logging. Marked @Global so feature modules can inject
 * AuditLogService without importing this module explicitly.
 */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
    providers: [AuditLogService],
    exports: [AuditLogService, TypeOrmModule],
})
export class AuditModule {}
