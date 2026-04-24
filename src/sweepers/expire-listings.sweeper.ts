import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { ResaleListingOrmEntity } from '../marketplace/infrastructure/orm/resale-listing.orm.entity';
import { ResaleListingStatus } from '../marketplace/domain/types/resale-listing-status';
import { TicketOrmEntity } from '../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketStatus } from '../tickets/domain/types/ticket-status';

/**
 * Flips ACTIVE resale listings whose expires_at elapsed to EXPIRED, and
 * restores the underlying ticket from LISTED back to ISSUED. Skips RESERVED
 * listings (those are handled by ReleaseReservationsSweeper).
 */
@Injectable()
export class ExpireListingsSweeper {
    private readonly logger = new Logger(ExpireListingsSweeper.name);
    private readonly enabled: boolean;

    constructor(
        @InjectRepository(ResaleListingOrmEntity)
        private readonly listingRepo: Repository<ResaleListingOrmEntity>,
        private readonly dataSource: DataSource,
        config: ConfigService,
    ) {
        this.enabled = config.get<boolean>('SWEEPER_ENABLED', true);
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async sweep(): Promise<void> {
        if (!this.enabled) return;
        const now = new Date();
        const expired = await this.listingRepo.find({
            where: {
                status: ResaleListingStatus.ACTIVE,
                expiresAt: LessThan(now),
            },
        });
        if (expired.length === 0) return;

        for (const listing of expired) {
            const qr = this.dataSource.createQueryRunner();
            await qr.connect();
            await qr.startTransaction();
            try {
                await qr.manager.update(ResaleListingOrmEntity, listing.id, {
                    status: ResaleListingStatus.EXPIRED,
                    updatedAt: now,
                });
                await qr.manager.update(
                    TicketOrmEntity,
                    { id: listing.ticketId, status: TicketStatus.LISTED },
                    { status: TicketStatus.ISSUED, updatedAt: now },
                );
                await qr.commitTransaction();
            } catch (err: any) {
                await qr.rollbackTransaction();
                this.logger.error(
                    `expireListings failed for ${listing.id}: ${err?.message}`,
                );
            } finally {
                await qr.release();
            }
        }
        this.logger.log(`expired ${expired.length} resale listing(s)`);
    }
}
