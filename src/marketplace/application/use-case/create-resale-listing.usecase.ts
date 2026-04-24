import { DataSource } from 'typeorm';
import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../../events/domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../events/domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../events/domain/repositories/ticket-section.repository';
import { EventStatus } from '../../../events/domain/types/event-status';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketStatus } from '../../../tickets/domain/types/ticket-status';
import { ResaleListingEntity } from '../../domain/entities/resale-listing.entity';
import { IResaleListingRepository } from '../../domain/repositories/resale-listing.repository';
import { ResaleListingStatus } from '../../domain/types/resale-listing-status';
import { CreateResaleListingDto } from '../dto/create-resale-listing.dto';
import { computeResalePricing } from './helpers/resale-pricing';
import { IPayoutMethodRepository } from '../../../payout-methods/domain/repositories/payout-method.repository';

export type CreateResaleListingConfig = {
    platformFeePct: number;
    priceCapMultiplier: number;
    maxDays: number;
};

/**
 * Seller creates a listing for a ticket they own. Enforces:
 *  - ticket belongs to seller and is ISSUED
 *  - event.resaleEnabled + section.resaleAllowed
 *  - before session.resaleCutoffAt
 *  - ask price between 1 and faceValue * priceCapMultiplier
 *  - no existing ACTIVE/RESERVED listing for this ticket
 * Atomically locks the ticket row and flips it to LISTED.
 */
export class CreateResaleListingUseCase {
    constructor(
        private readonly dataSource: DataSource,
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly listingRepo: IResaleListingRepository,
        private readonly payoutMethodRepo: IPayoutMethodRepository,
        private readonly config: CreateResaleListingConfig,
    ) {}

    async execute(
        sellerUserId: string,
        dto: CreateResaleListingDto,
    ): Promise<ResaleListingEntity> {
        // Require a registered payout method before allowing the listing.
        // Otherwise we'd have no way to disperse the funds after settlement.
        const defaultMethod =
            await this.payoutMethodRepo.findDefaultForUser(sellerUserId);
        if (!defaultMethod) {
            throw new UnprocessableDomainException(
                'You must register a payout method in your profile before listing a ticket for sale.',
                'PAYOUT_METHOD_REQUIRED',
            );
        }

        const existing = await this.listingRepo.findActiveByTicket(dto.ticketId);
        if (existing) {
            throw new ConflictDomainException(
                'This ticket is already listed for resale',
                'ALREADY_LISTED',
            );
        }

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const ticket = await qr.manager.findOne(TicketOrmEntity, {
                where: { id: dto.ticketId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!ticket) {
                throw new NotFoundDomainException('Ticket not found');
            }
            if (ticket.currentOwnerUserId !== sellerUserId) {
                throw new ForbiddenDomainException(
                    'This ticket is not in your wallet',
                );
            }
            if (ticket.status !== TicketStatus.ISSUED) {
                throw new UnprocessableDomainException(
                    `Ticket cannot be listed (status: ${ticket.status})`,
                    'TICKET_NOT_LISTABLE',
                );
            }
            if (ticket.courtesy) {
                throw new UnprocessableDomainException(
                    'Courtesy tickets cannot be resold. You can still transfer it to another user.',
                    'COURTESY_NOT_RESELLABLE',
                );
            }

            const event = await this.eventRepo.findById(ticket.eventId);
            const session = await this.sessionRepo.findById(
                ticket.eventSessionId,
            );
            const section = await this.sectionRepo.findById(
                ticket.ticketSectionId,
            );
            if (!event || !session || !section) {
                throw new NotFoundDomainException('Ticket context missing');
            }

            if (
                event.status === EventStatus.CANCELLED ||
                event.status === EventStatus.ENDED
            ) {
                throw new UnprocessableDomainException(
                    'Event is not active',
                    'EVENT_INACTIVE',
                );
            }
            if (!event.resaleEnabled) {
                throw new ConflictDomainException(
                    'Resale is disabled for this event',
                    'RESALE_DISABLED',
                );
            }
            if (!section.resaleAllowed) {
                throw new ConflictDomainException(
                    'Resale is not allowed for this section',
                    'SECTION_RESALE_DISABLED',
                );
            }

            const now = new Date();
            if (
                session.resaleCutoffAt &&
                now.getTime() >= session.resaleCutoffAt.getTime()
            ) {
                throw new UnprocessableDomainException(
                    'Resale cutoff has passed',
                    'RESALE_CUTOFF',
                );
            }

            const priceCapMultiplier =
                event.resalePriceCapMultiplier ??
                this.config.priceCapMultiplier;
            const platformFeePct =
                event.resaleFeePct ?? this.config.platformFeePct;

            const priceCap = Math.round(
                ticket.faceValue * priceCapMultiplier,
            );
            if (dto.askPrice > priceCap) {
                throw new UnprocessableDomainException(
                    `Ask price exceeds the face-value cap (max ${priceCap})`,
                    'PRICE_CAP_EXCEEDED',
                );
            }

            const pricing = computeResalePricing(
                dto.askPrice,
                platformFeePct,
                ticket.currency,
            );

            const expiresAt = new Date(
                Math.min(
                    now.getTime() + this.config.maxDays * 86_400_000,
                    session.resaleCutoffAt
                        ? session.resaleCutoffAt.getTime()
                        : now.getTime() + this.config.maxDays * 86_400_000,
                ),
            );

            await qr.manager.update(TicketOrmEntity, ticket.id, {
                status: TicketStatus.LISTED,
                updatedAt: now,
            });

            const listing = await this.listingRepo.create(
                new ResaleListingEntity({
                    ticketId: ticket.id,
                    sellerUserId,
                    askPrice: pricing.askPrice,
                    platformFeeAmount: pricing.platformFeeAmount,
                    sellerNetAmount: pricing.sellerNetAmount,
                    currency: pricing.currency,
                    status: ResaleListingStatus.ACTIVE,
                    note: dto.note ?? null,
                    expiresAt,
                }),
            );

            await qr.commitTransaction();
            return listing;
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }
}
