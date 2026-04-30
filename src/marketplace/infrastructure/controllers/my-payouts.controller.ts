import { Controller, Get, Inject } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import { list_my_payouts_usecase_token } from '../tokens/marketplace.tokens';
import { ListMyPayoutsUseCase } from '../../application/use-case/list-my-payouts.usecase';

/**
 * Self-service: organizadores y vendedores de reventa ven el estado de
 * sus liquidaciones (PENDING / PAYABLE / PAID / FAILED). No expone
 * información de otros usuarios.
 */
@ApiTags('Me · Payouts')
@ApiCookieAuth()
@Controller('me/payouts')
export class MyPayoutsController {
    constructor(
        @Inject(list_my_payouts_usecase_token)
        private readonly listMine: ListMyPayoutsUseCase,
    ) {}

    @Get()
    list(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }
}
