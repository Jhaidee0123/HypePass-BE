import { DataSource } from 'typeorm';
import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';

/**
 * Seller-initiated cancel. Only ACTIVE listings can be cancelled — RESERVED
 * listings are locked until the reservation expires (so the buyer can finish
 * paying). Restores ticket status to ISSUED.
 */
export class CancelResaleListingUseCase {
    constructor(
        private readonly dataSource: DataSource,
        private readonly listingRepo: IResaleListingRepository,
    ) {}

    async execute(
        sellerUserId: string,
        listingId: string,
    ): Promise<ResaleListingEntity> {
        const listing = await this.listingRepo.findById(listingId);
        if (!listing) {
            throw new NotFoundDomainException('Listing not found');
        }
        if (listing.sellerUserId !== sellerUserId) {
            throw new ForbiddenDomainException('Not your listing');
        }
        if (listing.status !== ResaleListingStatus.ACTIVE) {
            throw new ConflictDomainException(
                `Listing cannot be cancelled (status: ${listing.status})`,
                'LISTING_NOT_CANCELLABLE',
            );
        }

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const now = new Date();
            const updated = await this.listingRepo.update(
                new ResaleListingEntity({
                    ...listing,
                    id: listing.id,
                    createdAt: listing.createdAt,
                    status: ResaleListingStatus.CANCELLED,
                    cancelledAt: now,
                    updatedAt: now,
                } as any),
            );

            await qr.manager.update(TicketOrmEntity, listing.ticketId, {
                status: TicketStatus.ISSUED,
                updatedAt: now,
            });

            await qr.commitTransaction();
            return updated;
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }
}
