import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { VenueOrmEntity } from './infrastructure/orm/venue.orm.entity';
import { VenueService } from './application/services/venue.service';
import { VenuesController } from './infrastructure/controllers/venues.controller';
import {
    create_venue_usecase_token,
    delete_venue_usecase_token,
    get_venue_usecase_token,
    list_venues_usecase_token,
    update_venue_usecase_token,
    venue_service_token,
} from './infrastructure/tokens/venues.tokens';
import { CreateVenueUseCase } from './application/use-case/create-venue.usecase';
import { ListVenuesUseCase } from './application/use-case/list-venues.usecase';
import { GetVenueUseCase } from './application/use-case/get-venue.usecase';
import { UpdateVenueUseCase } from './application/use-case/update-venue.usecase';
import { DeleteVenueUseCase } from './application/use-case/delete-venue.usecase';

@Module({
    imports: [
        TypeOrmModule.forFeature([VenueOrmEntity]),
        forwardRef(() => CompaniesModule),
    ],
    providers: [
        { provide: venue_service_token, useClass: VenueService },
        {
            provide: create_venue_usecase_token,
            useFactory: (s: VenueService) => new CreateVenueUseCase(s),
            inject: [venue_service_token],
        },
        {
            provide: list_venues_usecase_token,
            useFactory: (s: VenueService) => new ListVenuesUseCase(s),
            inject: [venue_service_token],
        },
        {
            provide: get_venue_usecase_token,
            useFactory: (s: VenueService) => new GetVenueUseCase(s),
            inject: [venue_service_token],
        },
        {
            provide: update_venue_usecase_token,
            useFactory: (s: VenueService) => new UpdateVenueUseCase(s),
            inject: [venue_service_token],
        },
        {
            provide: delete_venue_usecase_token,
            useFactory: (s: VenueService) => new DeleteVenueUseCase(s),
            inject: [venue_service_token],
        },
    ],
    controllers: [VenuesController],
    exports: [venue_service_token],
})
export class VenuesModule {}
