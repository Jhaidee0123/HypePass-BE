import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '../../../auth';
import {
    get_promoter_sales_usecase_token,
    list_my_promoted_events_usecase_token,
} from '../tokens/events.tokens';
import { ListMyPromotedEventsUseCase } from '../../application/use-case/list-my-promoted-events.usecase';
import { GetPromoterSalesUseCase } from '../../application/use-case/get-promoter-sales.usecase';

/**
 * Promoter self-service: any authenticated user can see the events they
 * promote and the orders attributed to their referral code. Buyer email is
 * masked in the detail view (privacy).
 */
@ApiTags('Promoter — Me')
@ApiCookieAuth()
@Controller('me/promoter')
export class PromoterController {
    constructor(
        @Inject(list_my_promoted_events_usecase_token)
        private readonly listMyEvents: ListMyPromotedEventsUseCase,
        @Inject(get_promoter_sales_usecase_token)
        private readonly getSales: GetPromoterSalesUseCase,
    ) {}

    @Get('events')
    listEvents(@Session() session: UserSession) {
        return this.listMyEvents.execute(session.user.id);
    }

    @Get('events/:eventId/sales')
    sales(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
    ) {
        return this.getSales.execute(session.user.id, eventId);
    }
}
