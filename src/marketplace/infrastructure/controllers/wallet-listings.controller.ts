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
import { CreateResaleListingDto } from '../../application/dto/create-resale-listing.dto';
import { UpdateResaleListingDto } from '../../application/dto/update-resale-listing.dto';
import {
    cancel_resale_listing_use_case_token,
    create_resale_listing_use_case_token,
    list_my_resale_listings_use_case_token,
    update_resale_listing_use_case_token,
} from '../tokens/marketplace.tokens';
import { CreateResaleListingUseCase } from '../../application/use-case/create-resale-listing.usecase';
import { CancelResaleListingUseCase } from '../../application/use-case/cancel-resale-listing.usecase';
import { ListMyResaleListingsUseCase } from '../../application/use-case/list-my-resale-listings.usecase';
import { UpdateResaleListingUseCase } from '../../application/use-case/update-resale-listing.usecase';

@ApiTags('Wallet · Listings')
@ApiCookieAuth()
@Controller('wallet/listings')
export class WalletListingsController {
    constructor(
        @Inject(create_resale_listing_use_case_token)
        private readonly createListing: CreateResaleListingUseCase,
        @Inject(cancel_resale_listing_use_case_token)
        private readonly cancelListing: CancelResaleListingUseCase,
        @Inject(list_my_resale_listings_use_case_token)
        private readonly listMine: ListMyResaleListingsUseCase,
        @Inject(update_resale_listing_use_case_token)
        private readonly updateListing: UpdateResaleListingUseCase,
    ) {}

    @Get()
    async list(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Session() session: UserSession,
        @Body() dto: CreateResaleListingDto,
    ) {
        return this.createListing.execute(session.user.id, dto);
    }

    @Patch(':id')
    async update(
        @Session() session: UserSession,
        @Param('id') listingId: string,
        @Body() dto: UpdateResaleListingDto,
    ) {
        return this.updateListing.execute(session.user.id, listingId, dto);
    }

    @Delete(':id')
    async cancel(
        @Session() session: UserSession,
        @Param('id') listingId: string,
    ) {
        return this.cancelListing.execute(session.user.id, listingId);
    }
}
