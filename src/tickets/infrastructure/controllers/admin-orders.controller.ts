import { Controller, Get, Inject, Param, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session, SYSTEM_ROLES, UserSession } from '../../../auth';
import {
    admin_mark_order_reconciled_usecase_token,
    admin_order_service_token,
} from '../tokens/tickets.tokens';
import {
    AdminOrderService,
    AdminOrderListFilter,
} from '../../application/services/admin-order.service';
import { AdminMarkOrderReconciledUseCase } from '../../application/use-case/admin-mark-reconciled.usecase';
import { AdminOrdersQueryDto } from '../../application/dto/admin-orders-query.dto';
import { OrderStatus, OrderType } from '../../domain/types/order-status';

@ApiTags('Admin — Orders')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/orders')
export class AdminOrdersController {
    constructor(
        @Inject(admin_order_service_token)
        private readonly orders: AdminOrderService,
        @Inject(admin_mark_order_reconciled_usecase_token)
        private readonly markReconciled: AdminMarkOrderReconciledUseCase,
    ) {}

    @Get()
    list(@Query() query: AdminOrdersQueryDto) {
        const filter: AdminOrderListFilter = {
            q: query.q,
            status: query.status as OrderStatus | undefined,
            type: query.type as OrderType | undefined,
            companyId: query.companyId,
            needsReconciliation:
                query.needsReconciliation === undefined
                    ? undefined
                    : query.needsReconciliation === 'true',
            dateFrom: query.from ? new Date(query.from) : undefined,
            dateTo: query.to ? new Date(query.to) : undefined,
            limit: query.limit,
            offset: query.offset,
        };
        return this.orders.list(filter);
    }

    @Get(':id')
    detail(@Param('id') id: string) {
        return this.orders.getDetail(id);
    }

    @Patch(':id/mark-reconciled')
    reconcile(@Param('id') id: string, @Session() session: UserSession) {
        return this.markReconciled.execute(id, session.user.id);
    }
}
