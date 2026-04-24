/**
 * Truncate every table so the next seed starts from scratch.
 *
 * Includes tables governed by Better Auth (`user`, `session`, `account`,
 * `verification`) — which are `synchronize: false` in TypeORM but still
 * need to be wiped between runs to avoid orphan Better Auth rows.
 *
 * Hard-gated on `NODE_ENV=development` to make it impossible to blow away
 * staging/prod by accident.
 *
 * Usage:
 *   yarn db:reset
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

const EXTRA_BETTER_AUTH_TABLES = [
    'session',
    'account',
    'verification',
];

async function main() {
    if ((process.env.NODE_ENV ?? 'development') !== 'development') {
        console.error(
            `Refusing to run db:reset with NODE_ENV=${process.env.NODE_ENV}. Only 'development' is allowed.`,
        );
        process.exit(1);
    }

    process.env.SWEEPER_ENABLED = 'false';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });

    const dataSource = app.get(DataSource);

    // Collect every TypeORM-registered table (includes `user` even though
    // it's `synchronize: false`, because the @Entity metadata is still there).
    const typeormTables = dataSource.entityMetadatas.map(
        (m) => `"${m.tableName}"`,
    );
    const extras = EXTRA_BETTER_AUTH_TABLES.map((t) => `"${t}"`);
    const allTables = Array.from(new Set([...typeormTables, ...extras]));

    console.log(`→ Truncating ${allTables.length} tables…`);
    try {
        await dataSource.query(
            `TRUNCATE ${allTables.join(', ')} RESTART IDENTITY CASCADE;`,
        );
        console.log('✓ Database reset complete.');
    } catch (err: any) {
        console.error(`✗ Truncate failed: ${err?.message ?? err}`);
        await app.close();
        process.exit(1);
    }

    await app.close();
}

main().catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
});
