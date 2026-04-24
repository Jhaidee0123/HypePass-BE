import { VenueEntity } from '../../domain/entities/venue.entity';
import { IVenueRepository } from '../../domain/repositories/venue.repository';

export class ListVenuesUseCase {
    constructor(private readonly repo: IVenueRepository) {}

    execute(companyId: string): Promise<VenueEntity[]> {
        return this.repo.findAll({ companyId });
    }
}
