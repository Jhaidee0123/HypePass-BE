import {
    Controller,
    Get,
    Header,
    Inject,
    Query,
    Res,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles, SYSTEM_ROLES } from '../../../auth';
import {
    export_orders_usecase_token,
    export_payouts_usecase_token,
    export_users_usecase_token,
} from '../tokens/admin.tokens';
import { ExportOrdersUseCase } from '../../application/use-case/export-orders.usecase';
import { ExportPayoutsUseCase } from '../../application/use-case/export-payouts.usecase';
import { ExportUsersUseCase } from '../../application/use-case/export-users.usecase';

const setDownloadHeaders = (res: Response, filename: string) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
    );
};

@ApiTags('Admin — Exports')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/exports')
export class AdminExportsController {
    constructor(
        @Inject(export_orders_usecase_token)
        private readonly orders: ExportOrdersUseCase,
        @Inject(export_payouts_usecase_token)
        private readonly payouts: ExportPayoutsUseCase,
        @Inject(export_users_usecase_token)
        private readonly users: ExportUsersUseCase,
    ) {}

    @Get('orders.csv')
    @Header('Cache-Control', 'no-store')
    async ordersCsv(
        @Res() res: Response,
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('companyId') companyId?: string,
        @Query('needsReconciliation') needsReconciliation?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const csv = await this.orders.execute({
            status,
            type,
            companyId,
            needsReconciliation:
                needsReconciliation === undefined
                    ? undefined
                    : needsReconciliation === 'true',
            dateFrom: from ? new Date(from) : undefined,
            dateTo: to ? new Date(to) : undefined,
        });
        setDownloadHeaders(res, `orders-${Date.now()}.csv`);
        res.send(csv);
    }

    @Get('payouts.csv')
    @Header('Cache-Control', 'no-store')
    async payoutsCsv(
        @Res() res: Response,
        @Query('status') status?: string,
    ) {
        const csv = await this.payouts.execute({ status });
        setDownloadHeaders(res, `payouts-${Date.now()}.csv`);
        res.send(csv);
    }

    @Get('users.csv')
    @Header('Cache-Control', 'no-store')
    async usersCsv(@Res() res: Response) {
        const csv = await this.users.execute();
        setDownloadHeaders(res, `users-${Date.now()}.csv`);
        res.send(csv);
    }
}
