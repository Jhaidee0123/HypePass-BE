import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { ResaleListingOrmEntity } from '../marketplace/infrastructure/orm/resale-listing.orm.entity';
import { ResaleListingStatus } from '../marketplace/domain/types/resale-listing-status';
import { ResaleOrderOrmEntity } from '../marketplace/infrastructure/orm/resale-order.orm.entity';
import { ResaleOrderStatus } from '../marketplace/domain/types/resale-order-status';
import { TicketOrmEntity } from '../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketStatus } from '../tickets/domain/types/ticket-status';
import { OrderOrmEntity } from '../tickets/infrastructure/orm/order.orm.entity';
import { OrderStatus } from '../tickets/domain/types/order-status';

/**
 * Releases stuck RESERVED resale listings whose reserved_until passed without
 * the buyer completing payment. Flips the listing back to ACTIVE, the ticket
 * back to LISTED, and marks the resale order EXPIRED + underlying order
 * EXPIRED so the ref cannot settle later.
 *
 * This covers the "tab abandonment" case where the Wompi webhook never fires
 * a terminal status. If the webhook does fire later with APPROVED we still
 * settle (the ticket ends up with the buyer) — that is intentional; losing
 * the race would require rebooking, which we accept.
 */
@Injectable()
export class ReleaseReservationsSweeper {
    private readonly logger = new Logger(ReleaseReservationsSweeper.name);
    private readonly enabled: boolean;

    constructor(
        @InjectRepository(ResaleListingOrmEntity)
        private readonly listingRepo: Repository<ResaleListingOrmEntity>,
        private readonly dataSource: DataSource,
        config: ConfigService,
    ) {
        this.enabled = config.get<boolean>('SWEEPER_ENABLED', true);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async sweep(): Promise<void> {
        if (!this.enabled) return;
        const now = new Date();
        const stuck = await this.listingRepo.find({
            where: {
                status: ResaleListingStatus.RESERVED,
                reservedUntil: LessThan(now),
            },
        });
        if (stuck.length === 0) return;

        let released = 0;
        for (const listing of stuck) {
            const qr = this.dataSource.createQueryRunner();
            await qr.connect();
            await qr.startTransaction();
            try {
                await qr.manager.update(ResaleListingOrmEntity, listing.id, {
                    status: ResaleListingStatus.ACTIVE,
                    reservedByUserId: null,
                    reservedUntil: null,
                    updatedAt: now,
                });
                await qr.manager.update(
                    TicketOrmEntity,
                    {
                        id: listing.ticketId,
                        status: TicketStatus.RESERVED_FOR_RESALE,
                    },
                    { status: TicketStatus.LISTED, updatedAt: now },
                );

                // Find the pending resale order pointing at this listing and
                // expire it + its underlying order (if still AWAITING_PAYMENT).
                const pending = await qr.manager.findOne(ResaleOrderOrmEntity, {
                    where: {
                        resaleListingId: listing.id,
                        status: ResaleOrderStatus.PENDING,
                    },
                    order: { createdAt: 'DESC' },
                });
                if (pending) {
                    await qr.manager.update(ResaleOrderOrmEntity, pending.id, {
                        status: ResaleOrderStatus.EXPIRED,
                        updatedAt: now,
                    });
                    await qr.manager.update(
                        OrderOrmEntity,
                        {
                            id: pending.orderId,
                            status: OrderStatus.AWAITING_PAYMENT,
                        },
                        { status: OrderStatus.EXPIRED, updatedAt: now },
                    );
                }

                await qr.commitTransaction();
                released++;
            } catch (err: any) {
                await qr.rollbackTransaction();
                this.logger.error(
                    `releaseReservation failed for ${listing.id}: ${err?.message}`,
                );
            } finally {
                await qr.release();
            }
        }
        if (released) {
            this.logger.log(`released ${released} stale resale reservation(s)`);
        }
    }
}
