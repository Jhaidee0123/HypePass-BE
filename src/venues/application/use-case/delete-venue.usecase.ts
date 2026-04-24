import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IVenueRepository } from '../../domain/repositories/venue.repository';

export class DeleteVenueUseCase {
    constructor(private readonly repo: IVenueRepository) {}

    async execute(companyId: string, venueId: string): Promise<void> {
        const current = await this.repo.findById(venueId);
        if (!current) throw new NotFoundDomainException('Venue not found');
        if (current.companyId !== companyId) {
            throw new ForbiddenDomainException(
                'Venue does not belong to this company',
            );
        }
        await this.repo.delete(venueId);
    }
}
