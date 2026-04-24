import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PayoutRecordOrmEntity } from '../marketplace/infrastructure/orm/payout-record.orm.entity';
import { PayoutRecordStatus } from '../marketplace/domain/types/payout-record-status';

/**
 * Promotes PENDING_EVENT payouts whose escrow window has elapsed to PAYABLE,
 * so an admin can actually disperse them. Runs every 15 minutes — granularity
 * is fine given the hold window is hours.
 */
@Injectable()
export class ReleasePayoutsSweeper {
    private readonly logger = new Logger(ReleasePayoutsSweeper.name);
    private readonly enabled: boolean;

    constructor(
        @InjectRepository(PayoutRecordOrmEntity)
        private readonly repo: Repository<PayoutRecordOrmEntity>,
        config: ConfigService,
    ) {
        this.enabled = config.get<boolean>('SWEEPER_ENABLED', true);
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async sweep(): Promise<void> {
        if (!this.enabled) return;
        const now = new Date();
        const result = await this.repo.update(
            {
                status: PayoutRecordStatus.PENDING_EVENT,
                releaseAt: LessThan(now),
            },
            { status: PayoutRecordStatus.PAYABLE, updatedAt: now },
        );
        if (result.affected) {
            this.logger.log(
                `released ${result.affected} payout(s) from escrow → PAYABLE`,
            );
        }
    }
}
