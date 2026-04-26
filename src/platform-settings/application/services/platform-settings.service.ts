import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettingOrmEntity } from '../../infrastructure/orm/platform-setting.orm.entity';
import {
    PLATFORM_SETTINGS_CATALOG,
    PlatformSettingDef,
    PlatformSettingKey,
    SETTINGS_BY_KEY,
} from '../../domain/types/platform-setting.types';
import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

export type PlatformSettingRow = PlatformSettingDef & {
    value: unknown;
    updatedByUserId: string | null;
    updatedAt: string;
};

/**
 * Source of truth for platform-wide flags. Hydrates a Map cache on boot,
 * refreshes after every write. Reads are O(1) and synchronous so call sites
 * (interceptors, use cases) don't have to await DB on the hot path.
 */
@Injectable()
export class PlatformSettingsService implements OnModuleInit {
    private readonly logger = new Logger(PlatformSettingsService.name);
    private cache = new Map<PlatformSettingKey, PlatformSettingRow>();

    constructor(
        @InjectRepository(PlatformSettingOrmEntity)
        private readonly repo: Repository<PlatformSettingOrmEntity>,
        private readonly audit: AuditLogService,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.bootstrapDefaults();
        await this.refresh();
    }

    /** Insert any missing rows (idempotent). Useful on first boot + when adding a new setting. */
    private async bootstrapDefaults(): Promise<void> {
        const existing = await this.repo.find();
        const existingKeys = new Set(existing.map((row) => row.key));
        const toInsert = PLATFORM_SETTINGS_CATALOG.filter(
            (def) => !existingKeys.has(def.key),
        );
        if (toInsert.length === 0) return;
        await this.repo.save(
            toInsert.map((def) =>
                this.repo.create({
                    key: def.key,
                    value: def.defaultValue,
                    description: def.description,
                    type: def.type,
                    group: def.group,
                    updatedByUserId: null,
                }),
            ),
        );
        this.logger.log(`bootstrapped ${toInsert.length} platform setting(s)`);
    }

    private async refresh(): Promise<void> {
        const rows = await this.repo.find();
        const next = new Map<PlatformSettingKey, PlatformSettingRow>();
        for (const def of PLATFORM_SETTINGS_CATALOG) {
            const row = rows.find((r) => r.key === def.key);
            next.set(def.key, {
                ...def,
                value: row ? row.value : def.defaultValue,
                updatedByUserId: row ? row.updatedByUserId : null,
                updatedAt: row ? row.updatedAt.toISOString() : new Date(0).toISOString(),
            });
        }
        this.cache = next;
    }

    list(): PlatformSettingRow[] {
        return PLATFORM_SETTINGS_CATALOG.map((def) => this.cache.get(def.key)!);
    }

    get<T = unknown>(key: PlatformSettingKey): T {
        const row = this.cache.get(key);
        if (!row) throw new Error(`platform setting not found: ${key}`);
        return row.value as T;
    }

    /** Type-safe convenience for booleans/numbers (returns default on missing/wrong type). */
    bool(key: PlatformSettingKey, fallback = false): boolean {
        const v = this.cache.get(key)?.value;
        return typeof v === 'boolean' ? v : fallback;
    }

    num(key: PlatformSettingKey, fallback = 0): number {
        const v = this.cache.get(key)?.value;
        return typeof v === 'number' ? v : fallback;
    }

    str(key: PlatformSettingKey, fallback = ''): string {
        const v = this.cache.get(key)?.value;
        return typeof v === 'string' ? v : fallback;
    }

    async update(
        key: PlatformSettingKey,
        value: unknown,
        actorUserId: string | null,
    ): Promise<PlatformSettingRow> {
        const def = SETTINGS_BY_KEY.get(key);
        if (!def) {
            throw new UnprocessableDomainException(`unknown platform setting: ${key}`);
        }
        this.validate(def, value);
        const previous = this.cache.get(key)?.value;
        await this.repo.update(
            { key },
            { value: value as unknown as object, updatedByUserId: actorUserId },
        );
        await this.refresh();
        void this.audit.record({
            action: 'platform_setting.updated',
            actorUserId,
            actorKind: actorUserId ? 'user' : 'system',
            targetType: 'platform_setting',
            targetId: key,
            metadata: { previous, next: value },
        });
        return this.cache.get(key)!;
    }

    private validate(def: PlatformSettingDef, value: unknown): void {
        switch (def.type) {
            case 'boolean':
                if (typeof value !== 'boolean') {
                    throw new UnprocessableDomainException(
                        `${def.key} must be boolean`,
                    );
                }
                return;
            case 'number':
                if (typeof value !== 'number' || Number.isNaN(value)) {
                    throw new UnprocessableDomainException(
                        `${def.key} must be number`,
                    );
                }
                return;
            case 'string':
                if (typeof value !== 'string') {
                    throw new UnprocessableDomainException(
                        `${def.key} must be string`,
                    );
                }
                return;
            case 'string_array':
                if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
                    throw new UnprocessableDomainException(
                        `${def.key} must be string[]`,
                    );
                }
                return;
        }
    }
}
