import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import { CreatePayoutMethodDto } from '../../application/dto/create-payout-method.dto';
import { UpdatePayoutMethodDto } from '../../application/dto/update-payout-method.dto';
import {
    create_payout_method_usecase_token,
    delete_payout_method_usecase_token,
    list_my_payout_methods_usecase_token,
    make_default_payout_method_usecase_token,
    update_payout_method_usecase_token,
} from '../tokens/payout-methods.tokens';
import { ListMyPayoutMethodsUseCase } from '../../application/use-case/list-my-payout-methods.usecase';
import { CreatePayoutMethodUseCase } from '../../application/use-case/create-payout-method.usecase';
import { UpdatePayoutMethodUseCase } from '../../application/use-case/update-payout-method.usecase';
import { DeletePayoutMethodUseCase } from '../../application/use-case/delete-payout-method.usecase';
import { MakeDefaultPayoutMethodUseCase } from '../../application/use-case/make-default-payout-method.usecase';
import { WompiPayoutsService } from '../../../payments/infrastructure/services/wompi-payouts.service';

@ApiTags('Profile · Payout methods')
@ApiCookieAuth()
@Controller('profile/payout-methods')
export class ProfilePayoutMethodsController {
    constructor(
        @Inject(list_my_payout_methods_usecase_token)
        private readonly listMine: ListMyPayoutMethodsUseCase,
        @Inject(create_payout_method_usecase_token)
        private readonly createMethod: CreatePayoutMethodUseCase,
        @Inject(update_payout_method_usecase_token)
        private readonly updateMethod: UpdatePayoutMethodUseCase,
        @Inject(delete_payout_method_usecase_token)
        private readonly deleteMethod: DeletePayoutMethodUseCase,
        @Inject(make_default_payout_method_usecase_token)
        private readonly makeDefault: MakeDefaultPayoutMethodUseCase,
        private readonly wompiPayouts: WompiPayoutsService,
    ) {}

    @Get()
    list(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }

    /**
     * Bank catalog from Wompi (cached 24h server-side). Used by the FE
     * payout-method form to populate the bank dropdown so we capture the
     * exact `wompiBankId` required by the Payouts API.
     *
     * Auth-only (any logged user); the data isn't sensitive.
     */
    @Get('banks')
    listBanks() {
        return this.wompiPayouts.listBanks();
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Session() session: UserSession,
        @Body() dto: CreatePayoutMethodDto,
    ) {
        return this.createMethod.execute(session.user.id, dto);
    }

    @Patch(':id')
    update(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Body() dto: UpdatePayoutMethodDto,
    ) {
        return this.updateMethod.execute(session.user.id, id, dto);
    }

    @Patch(':id/make-default')
    setDefault(
        @Session() session: UserSession,
        @Param('id') id: string,
    ) {
        return this.makeDefault.execute(session.user.id, id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Session() session: UserSession,
        @Param('id') id: string,
    ): Promise<void> {
        await this.deleteMethod.execute(session.user.id, id);
    }
}
