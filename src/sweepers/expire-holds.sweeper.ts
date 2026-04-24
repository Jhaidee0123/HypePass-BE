import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { InventoryHoldOrmEntity } from '../tickets/infrastructure/orm/inventory-hold.orm.entity';
import { InventoryHoldStatus } from '../tickets/domain/types/inventory-hold-status';

/**
 * Marks ACTIVE inventory holds whose expires_at already elapsed as EXPIRED.
 * Runs every minute. Inventory accounting already ignores expired holds via
 * `expires_at > now`, so this sweeper is purely for hygiene — prevents the
 * holds table from growing unbounded and exposes stale holds to analytics.
 *
 * Disable by setting SWEEPER_ENABLED=false.
 */
@Injectable()
export class ExpireHoldsSweeper {
    private readonly logger = new Logger(ExpireHoldsSweeper.name);
    private readonly enabled: boolean;

    constructor(
        @InjectRepository(InventoryHoldOrmEntity)
        private readonly repo: Repository<InventoryHoldOrmEntity>,
        config: ConfigService,
    ) {
        this.enabled = config.get<boolean>('SWEEPER_ENABLED', true);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async sweep(): Promise<void> {
        if (!this.enabled) return;
        const now = new Date();
        const result = await this.repo.update(
            {
                status: InventoryHoldStatus.ACTIVE,
                expiresAt: LessThan(now),
            },
            { status: InventoryHoldStatus.EXPIRED, updatedAt: now },
        );
        if (result.affected) {
            this.logger.log(`expired ${result.affected} inventory hold(s)`);
        }
    }
}
