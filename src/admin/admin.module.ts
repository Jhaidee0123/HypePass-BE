import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetAdminDashboardUseCase } from './application/use-case/get-dashboard.usecase';
import { GetSystemLogsUseCase } from './application/use-case/get-system-logs.usecase';
import { ExportOrdersUseCase } from './application/use-case/export-orders.usecase';
import { ExportPayoutsUseCase } from './application/use-case/export-payouts.usecase';
import { ExportUsersUseCase } from './application/use-case/export-users.usecase';
import { GetGlobalViewsUseCase } from './application/use-case/get-global-views.usecase';
import { AdminDashboardController } from './infrastructure/controllers/admin-dashboard.controller';
import { AdminSystemLogsController } from './infrastructure/controllers/admin-system-logs.controller';
import { AdminExportsController } from './infrastructure/controllers/admin-exports.controller';
import { AdminGlobalViewsController } from './infrastructure/controllers/admin-global-views.controller';
import {
    export_orders_usecase_token,
    export_payouts_usecase_token,
    export_users_usecase_token,
    get_admin_dashboard_usecase_token,
    get_global_views_usecase_token,
    get_system_logs_usecase_token,
} from './infrastructure/tokens/admin.tokens';

/**
 * Cross-cutting admin endpoints. Dashboard, system logs, CSV exports,
 * global cross-event views (courtesies, staff).
 */
@Module({
    providers: [
        {
            provide: get_admin_dashboard_usecase_token,
            useFactory: (ds: DataSource) => new GetAdminDashboardUseCase(ds),
            inject: [DataSource],
        },
        {
            provide: get_system_logs_usecase_token,
            useFactory: () => new GetSystemLogsUseCase(),
        },
        {
            provide: export_orders_usecase_token,
            useFactory: (ds: DataSource) => new ExportOrdersUseCase(ds),
            inject: [DataSource],
        },
        {
            provide: export_payouts_usecase_token,
            useFactory: (ds: DataSource) => new ExportPayoutsUseCase(ds),
            inject: [DataSource],
        },
        {
            provide: export_users_usecase_token,
            useFactory: (ds: DataSource) => new ExportUsersUseCase(ds),
            inject: [DataSource],
        },
        {
            provide: get_global_views_usecase_token,
            useFactory: (ds: DataSource) => new GetGlobalViewsUseCase(ds),
            inject: [DataSource],
        },
    ],
    controllers: [
        AdminDashboardController,
        AdminSystemLogsController,
        AdminExportsController,
        AdminGlobalViewsController,
    ],
})
export class AdminModule {}
