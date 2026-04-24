import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous, Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import { InitiateResaleCheckoutDto } from '../../application/dto/initiate-resale-checkout.dto';
import {
    get_resale_listing_use_case_token,
    initiate_resale_checkout_use_case_token,
    list_active_resale_listings_use_case_token,
} from '../tokens/marketplace.tokens';
import { ListActiveResaleListingsUseCase } from '../../application/use-case/list-active-resale-listings.usecase';
import { GetResaleListingUseCase } from '../../application/use-case/get-resale-listing.usecase';
import { InitiateResaleCheckoutUseCase } from '../../application/use-case/initiate-resale-checkout.usecase';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketController {
    constructor(
        @Inject(list_active_resale_listings_use_case_token)
        private readonly listActive: ListActiveResaleListingsUseCase,
        @Inject(get_resale_listing_use_case_token)
        private readonly getOne: GetResaleListingUseCase,
        @Inject(initiate_resale_checkout_use_case_token)
        private readonly initiate: InitiateResaleCheckoutUseCase,
    ) {}

    @Get('listings')
    @AllowAnonymous()
    async listActiveListings() {
        return this.listActive.execute();
    }

    @Get('listings/:id')
    @AllowAnonymous()
    async getListing(@Param('id') id: string) {
        return this.getOne.execute(id);
    }

    @Post('checkout/initiate')
    @ApiCookieAuth()
    @HttpCode(HttpStatus.OK)
    async initiateResaleCheckout(
        @Session() session: UserSession,
        @Body() dto: InitiateResaleCheckoutDto,
    ) {
        return this.initiate.execute(session.user.id, session.user.email, dto);
    }
}
