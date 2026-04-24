import { IBaseRepository } from '../../../shared/domain/repositories/base.repository';
import { VenueEntity } from '../entities/venue.entity';
import { VenueQueryFilter } from '../types/venue-query-filter';

export interface IVenueRepository
    extends IBaseRepository<VenueEntity, VenueQueryFilter> {}
