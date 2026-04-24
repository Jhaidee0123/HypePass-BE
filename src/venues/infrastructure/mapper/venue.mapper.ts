import { VenueEntity } from '../../domain/entities/venue.entity';
import { VenueOrmEntity } from '../orm/venue.orm.entity';

export class VenueMapper {
    static toDomain(orm: VenueOrmEntity): VenueEntity {
        return new VenueEntity({
            id: orm.id,
            companyId: orm.companyId,
            name: orm.name,
            addressLine: orm.addressLine,
            city: orm.city,
            region: orm.region,
            country: orm.country,
            latitude: orm.latitude,
            longitude: orm.longitude,
            capacity: orm.capacity,
            description: orm.description,
            imageUrl: orm.imageUrl,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: VenueEntity): Partial<VenueOrmEntity> {
        return {
            id: entity.id,
            companyId: entity.companyId,
            name: entity.name,
            addressLine: entity.addressLine,
            city: entity.city,
            region: entity.region ?? null,
            country: entity.country,
            latitude: entity.latitude ?? null,
            longitude: entity.longitude ?? null,
            capacity: entity.capacity ?? null,
            description: entity.description ?? null,
            imageUrl: entity.imageUrl ?? null,
        };
    }
}
