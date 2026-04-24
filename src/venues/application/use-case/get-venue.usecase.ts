import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { VenueEntity } from '../../domain/entities/venue.entity';
import { IVenueRepository } from '../../domain/repositories/venue.repository';

export class GetVenueUseCase {
    constructor(private readonly repo: IVenueRepository) {}

    async execute(companyId: string, venueId: string): Promise<VenueEntity> {
        const venue = await this.repo.findById(venueId);
        if (!venue) throw new NotFoundDomainException('Venue not found');
        if (venue.companyId !== companyId) {
            throw new ForbiddenDomainException(
                'Venue does not belong to this company',
            );
        }
        return venue;
    }
}
