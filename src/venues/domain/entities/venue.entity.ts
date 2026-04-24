import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { VenueProps } from '../types/venue.props';

export class VenueEntity extends BaseEntity {
    readonly companyId: string;
    readonly name: string;
    readonly addressLine: string;
    readonly city: string;
    readonly region?: string | null;
    readonly country: string;
    readonly latitude?: number | null;
    readonly longitude?: number | null;
    readonly capacity?: number | null;
    readonly description?: string | null;
    readonly imageUrl?: string | null;

    constructor(props: VenueProps) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.addressLine = props.addressLine;
        this.city = props.city;
        this.region = props.region;
        this.country = props.country;
        this.latitude = props.latitude;
        this.longitude = props.longitude;
        this.capacity = props.capacity;
        this.description = props.description;
        this.imageUrl = props.imageUrl;
    }
}
