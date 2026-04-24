import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryHoldOrmEntity } from '../tickets/infrastructure/orm/inventory-hold.orm.entity';
import { ResaleListingOrmEntity } from '../marketplace/infrastructure/orm/resale-listing.orm.entity';
import { PayoutRecordOrmEntity } from '../marketplace/infrastructure/orm/payout-record.orm.entity';
import { ExpireHoldsSweeper } from './expire-holds.sweeper';
import { ExpireListingsSweeper } from './expire-listings.sweeper';
import { ReleaseReservationsSweeper } from './release-reservations.sweeper';
import { ReleasePayoutsSweeper } from './release-payouts.sweeper';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            InventoryHoldOrmEntity,
            ResaleListingOrmEntity,
            PayoutRecordOrmEntity,
        ]),
    ],
    providers: [
        ExpireHoldsSweeper,
        ExpireListingsSweeper,
        ReleaseReservationsSweeper,
        ReleasePayoutsSweeper,
    ],
})
export class SweepersModule {}
