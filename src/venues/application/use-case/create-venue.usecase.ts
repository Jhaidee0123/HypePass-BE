import { VenueEntity } from '../../domain/entities/venue.entity';
import { IVenueRepository } from '../../domain/repositories/venue.repository';
import { CreateVenueDto } from '../dto/create-venue.dto';

export class CreateVenueUseCase {
    constructor(private readonly repo: IVenueRepository) {}

    execute(companyId: string, dto: CreateVenueDto): Promise<VenueEntity> {
        const venue = new VenueEntity({
            companyId,
            name: dto.name,
            addressLine: dto.addressLine,
            city: dto.city,
            region: dto.region ?? null,
            country: dto.country,
            latitude: dto.latitude ?? null,
            longitude: dto.longitude ?? null,
            capacity: dto.capacity ?? null,
            description: dto.description ?? null,
            imageUrl: dto.imageUrl ?? null,
        });
        return this.repo.create(venue);
    }
}
