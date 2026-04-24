import { BaseProps } from '../../../shared/domain/types/base.props';

export type VenueProps = BaseProps & {
    companyId: string;
    name: string;
    addressLine: string;
    city: string;
    region?: string | null;
    country: string;
    latitude?: number | null;
    longitude?: number | null;
    capacity?: number | null;
    description?: string | null;
    imageUrl?: string | null;
};
