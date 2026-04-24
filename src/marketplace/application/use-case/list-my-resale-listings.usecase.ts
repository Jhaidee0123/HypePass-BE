import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';

export class ListMyResaleListingsUseCase {
    constructor(private readonly listingRepo: IResaleListingRepository) {}

    execute(sellerUserId: string): Promise<ResaleListingEntity[]> {
        return this.listingRepo.findBySeller(sellerUserId);
    }
}
