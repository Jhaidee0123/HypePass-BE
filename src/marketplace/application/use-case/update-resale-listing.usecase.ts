import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { ITicketRepository } from '../../../tickets/domain/repositories/ticket.repository';
import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';
import { UpdateResaleListingDto } from '../dto/update-resale-listing.dto';
import { computeResalePricing } from './helpers/resale-pricing';

export type UpdateResaleListingConfig = {
    platformFeePct: number;
    priceCapMultiplier: number;
};

/**
 * Allows the seller to tweak askPrice and/or note while the listing is still
 * ACTIVE (never RESERVED or terminal). Re-applies the price cap and
 * recomputes platform fee + seller net from the current event config (falling
 * back to platform defaults when the event doesn't override them).
 */
export class UpdateResaleListingUseCase {
    constructor(
        private readonly listingRepo: IResaleListingRepository,
        private readonly ticketRepo: ITicketRepository,
        private readonly eventRepo: IEventRepository,
        private readonly config: UpdateResaleListingConfig,
    ) {}

    async execute(
        sellerUserId: string,
        listingId: string,
        dto: UpdateResaleListingDto,
    ): Promise<ResaleListingEntity> {
        const listing = await this.listingRepo.findById(listingId);
        if (!listing) throw new NotFoundDomainException('Listing not found');
        if (listing.sellerUserId !== sellerUserId) {
            throw new ForbiddenDomainException('Not your listing');
        }
        if (listing.status !== ResaleListingStatus.ACTIVE) {
            throw new ConflictDomainException(
                `Listing cannot be edited (status: ${listing.status})`,
                'LISTING_NOT_EDITABLE',
            );
        }

        let nextAskPrice = listing.askPrice;
        let nextPlatformFee = listing.platformFeeAmount;
        let nextSellerNet = listing.sellerNetAmount;

        if (dto.askPrice !== undefined && dto.askPrice !== listing.askPrice) {
            const ticket = await this.ticketRepo.findById(listing.ticketId);
            if (!ticket) {
                throw new NotFoundDomainException('Ticket missing');
            }
            const event = await this.eventRepo.findById(ticket.eventId);
            const capMultiplier =
                event?.resalePriceCapMultiplier ??
                this.config.priceCapMultiplier;
            const feePct =
                event?.resaleFeePct ?? this.config.platformFeePct;

            const priceCap = Math.round(ticket.faceValue * capMultiplier);
            if (dto.askPrice > priceCap) {
                throw new UnprocessableDomainException(
                    `Ask price exceeds the face-value cap (max ${priceCap})`,
                    'PRICE_CAP_EXCEEDED',
                );
            }

            const pricing = computeResalePricing(
                dto.askPrice,
                feePct,
                listing.currency,
            );
            nextAskPrice = pricing.askPrice;
            nextPlatformFee = pricing.platformFeeAmount;
            nextSellerNet = pricing.sellerNetAmount;
        }

        const nextNote =
            dto.note !== undefined ? (dto.note?.trim() || null) : listing.note;

        const updated = await this.listingRepo.update(
            new ResaleListingEntity({
                ...listing,
                id: listing.id,
                createdAt: listing.createdAt,
                askPrice: nextAskPrice,
                platformFeeAmount: nextPlatformFee,
                sellerNetAmount: nextSellerNet,
                note: nextNote,
                updatedAt: new Date(),
            } as any),
        );
        return updated;
    }
}
