import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { VenueEntity } from '../../domain/entities/venue.entity';
import { IVenueRepository } from '../../domain/repositories/venue.repository';
import { UpdateVenueDto } from '../dto/update-venue.dto';

export class UpdateVenueUseCase {
    constructor(private readonly repo: IVenueRepository) {}

    async execute(
        companyId: string,
        venueId: string,
        dto: UpdateVenueDto,
    ): Promise<VenueEntity> {
        const current = await this.repo.findById(venueId);
        if (!current) throw new NotFoundDomainException('Venue not found');
        if (current.companyId !== companyId) {
            throw new ForbiddenDomainException(
                'Venue does not belong to this company',
            );
        }

        const next = new VenueEntity({
            id: current.id,
            createdAt: current.createdAt,
            companyId: current.companyId,
            name: dto.name ?? current.name,
            addressLine: dto.addressLine ?? current.addressLine,
            city: dto.city ?? current.city,
            region: dto.region ?? current.region,
            country: dto.country ?? current.country,
            latitude: dto.latitude ?? current.latitude,
            longitude: dto.longitude ?? current.longitude,
            capacity: dto.capacity ?? current.capacity,
            description: dto.description ?? current.description,
            imageUrl: dto.imageUrl ?? current.imageUrl,
            updatedAt: new Date(),
        });
        return this.repo.update(next);
    }
}
