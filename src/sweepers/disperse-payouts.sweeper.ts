import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayoutRecordOrmEntity } from '../marketplace/infrastructure/orm/payout-record.orm.entity';
import { PayoutRecordStatus } from '../marketplace/domain/types/payout-record-status';
import { disperse_payout_usecase_token } from '../marketplace/infrastructure/tokens/marketplace.tokens';
import { DispersePayoutUseCase } from '../marketplace/application/use-case/disperse-payout.usecase';

/**
 * Picks PAYABLE PayoutRecords and disperses them via Wompi Payouts API
 * (one at a time, sequentially to avoid hammering Wompi's rate limits).
 *
 * Runs every hour. Hard cap of 50 records per tick — anything bigger
 * waits to the next iteration. Disable with `SWEEPER_ENABLED=false`.
 *
 * Independent feature flag `WOMPI_PAYOUTS_ENABLED` lets us deploy this
 * sweeper before Wompi activates the SPT product. While the flag is
 * false the sweeper is a no-op.
 */
@Injectable()
export class DispersePayoutsSweeper {
    private readonly logger = new Logger(DispersePayoutsSweeper.name);
    private readonly enabled: boolean;
    private readonly batchSize: number;

    constructor(
        @InjectRepository(PayoutRecordOrmEntity)
        private readonly repo: Repository<PayoutRecordOrmEntity>,
        @Inject(disperse_payout_usecase_token)
        private readonly disperse: DispersePayoutUseCase,
        config: ConfigService,
    ) {
        this.enabled = config.get<boolean>('SWEEPER_ENABLED', true);
        this.batchSize = Number(
            config.get<number>('PAYOUT_DISPERSION_BATCH_SIZE', 50),
        );
    }

    @Cron(CronExpression.EVERY_HOUR)
    async sweep(): Promise<void> {
        if (!this.enabled) return;

        const candidates = await this.repo.find({
            where: { status: PayoutRecordStatus.PAYABLE },
            order: { createdAt: 'ASC' },
            take: this.batchSize,
        });

        if (candidates.length === 0) return;

        this.logger.log(
            `Dispersing ${candidates.length} payable payout(s) via Wompi…`,
        );

        let succeeded = 0;
        let permanentFailures = 0;
        let transientFailures = 0;

        for (const row of candidates) {
            const result = await this.disperse.execute(row.id);
            if (result.ok) {
                succeeded += 1;
            } else if (result.permanent) {
                permanentFailures += 1;
            } else {
                transientFailures += 1;
            }
        }

        this.logger.log(
            `Dispersion sweep done: ${succeeded} ok, ${permanentFailures} permanent fail, ${transientFailures} retryable.`,
        );
    }
}
