/**
 * One-shot migration: rename `company_memberships.role = 'staff'` rows to
 * `'viewer'` to match the new role enum. Idempotent (safe to re-run).
 *
 * Background: the company-level `'staff'` role was renamed to `'viewer'`
 * to disambiguate from per-event scanner staff (`event_staff_assignments`).
 *
 * Usage: yarn email:migrate-company-staff
 */
import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE ?? process.env.DB_NAME,
    });

    try {
        const before = await pool.query<{ count: string }>(
            `SELECT COUNT(*)::text AS count
             FROM company_memberships
             WHERE role = 'staff'`,
        );
        const n = Number(before.rows[0]?.count ?? 0);
        console.log(`[migrate] Found ${n} 'staff' membership(s).`);

        if (n === 0) {
            console.log(`[migrate] Nothing to do. ✓`);
            return;
        }

        const result = await pool.query(
            `UPDATE company_memberships
             SET role = 'viewer', updated_at = NOW()
             WHERE role = 'staff'`,
        );
        console.log(`[migrate] Renamed ${result.rowCount} row(s) staff → viewer ✓`);
    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    console.error(`[migrate] Failed:`, err);
    process.exit(1);
});
