import {
    Controller,
    Get,
    Inject,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session } from '../../../auth/decorators';
import { SYSTEM_ROLES, UserSession } from '../../../auth';
import { PayoutRecordStatus } from '../../domain/types/payout-record-status';
import {
    list_payouts_use_case_token,
    mark_payout_use_case_token,
} from '../tokens/marketplace.tokens';
import { ListPayoutsUseCase } from '../../application/use-case/admin/list-payouts.usecase';
import { MarkPayoutUseCase } from '../../application/use-case/admin/mark-payout.usecase';

@ApiTags('Admin · Payouts')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/payouts')
export class AdminPayoutsController {
    constructor(
        @Inject(list_payouts_use_case_token)
        private readonly listPayouts: ListPayoutsUseCase,
        @Inject(mark_payout_use_case_token)
        private readonly markPayout: MarkPayoutUseCase,
    ) {}

    @Get()
    list(
        @Query('status') status?: PayoutRecordStatus,
        @Query('sellerUserId') sellerUserId?: string,
    ) {
        return this.listPayouts.execute({ status, sellerUserId });
    }

    @Patch(':id/mark-paid')
    markPaid(@Session() session: UserSession, @Param('id') id: string) {
        return this.markPayout.execute(id, 'paid', session.user.id);
    }

    @Patch(':id/mark-failed')
    markFailed(@Session() session: UserSession, @Param('id') id: string) {
        return this.markPayout.execute(id, 'failed', session.user.id);
    }

    @Patch(':id/cancel')
    cancel(@Session() session: UserSession, @Param('id') id: string) {
        return this.markPayout.execute(id, 'cancelled', session.user.id);
    }
}
