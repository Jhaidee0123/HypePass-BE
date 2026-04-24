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
    UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { COMPANY_ROLES } from '../../../auth';
import { CompanyRoles } from '../../../auth/decorators/company-roles.decorator';
import { TenantGuard } from '../../../companies/infrastructure/guards/tenant.guard';
import { CreateVenueDto } from '../../application/dto/create-venue.dto';
import { UpdateVenueDto } from '../../application/dto/update-venue.dto';
import {
    create_venue_usecase_token,
    delete_venue_usecase_token,
    get_venue_usecase_token,
    list_venues_usecase_token,
    update_venue_usecase_token,
} from '../tokens/venues.tokens';
import { CreateVenueUseCase } from '../../application/use-case/create-venue.usecase';
import { ListVenuesUseCase } from '../../application/use-case/list-venues.usecase';
import { GetVenueUseCase } from '../../application/use-case/get-venue.usecase';
import { UpdateVenueUseCase } from '../../application/use-case/update-venue.usecase';
import { DeleteVenueUseCase } from '../../application/use-case/delete-venue.usecase';

@ApiTags('Venues')
@ApiCookieAuth()
@UseGuards(TenantGuard)
@Controller('companies/:companyId/venues')
export class VenuesController {
    constructor(
        @Inject(create_venue_usecase_token)
        private readonly createVenue: CreateVenueUseCase,
        @Inject(list_venues_usecase_token)
        private readonly listVenues: ListVenuesUseCase,
        @Inject(get_venue_usecase_token)
        private readonly getVenue: GetVenueUseCase,
        @Inject(update_venue_usecase_token)
        private readonly updateVenue: UpdateVenueUseCase,
        @Inject(delete_venue_usecase_token)
        private readonly deleteVenue: DeleteVenueUseCase,
    ) {}

    @Get()
    list(@Param('companyId') companyId: string) {
        return this.listVenues.execute(companyId);
    }

    @Get(':venueId')
    get(
        @Param('companyId') companyId: string,
        @Param('venueId') venueId: string,
    ) {
        return this.getVenue.execute(companyId, venueId);
    }

    @Post()
    @CompanyRoles([COMPANY_ROLES.OWNER, COMPANY_ROLES.ADMIN])
    create(
        @Param('companyId') companyId: string,
        @Body() dto: CreateVenueDto,
    ) {
        return this.createVenue.execute(companyId, dto);
    }

    @Patch(':venueId')
    @CompanyRoles([COMPANY_ROLES.OWNER, COMPANY_ROLES.ADMIN])
    update(
        @Param('companyId') companyId: string,
        @Param('venueId') venueId: string,
        @Body() dto: UpdateVenueDto,
    ) {
        return this.updateVenue.execute(companyId, venueId, dto);
    }

    @Delete(':venueId')
    @CompanyRoles([COMPANY_ROLES.OWNER, COMPANY_ROLES.ADMIN])
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('companyId') companyId: string,
        @Param('venueId') venueId: string,
    ) {
        await this.deleteVenue.execute(companyId, venueId);
    }
}
