/**
 * Seed users + companies for local testing.
 *
 * Two companies (to exercise multi-tenancy):
 *   - stage-live:  owner=owner@hypepass.test, admin=manager@hypepass.test,
 *                  staff=staff@hypepass.test, scanner=scanner@hypepass.test
 *   - bass-collective: owner=dj@basscollective.test
 *
 * Additional attendees:
 *   - buyer@hypepass.test   (main test buyer with wallet activity)
 *   - laura@hypepass.test            (owns a resale listing)
 *   - pedro@hypepass.test            (receives a courtesy)
 *   - jhaider23@hotmail.com (platform admin)
 *
 * Both companies are seeded in ACTIVE status so owners can draft events
 * immediately without going through the review flow.
 *
 * Idempotent: re-running is safe. `yarn db:reset` first for a clean slate.
 *
 * Usage:
 *   yarn db:seed-users
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { BETTER_AUTH, COMPANY_ROLES, CompanyRole } from '../src/auth/constants';
import {
    company_membership_service_token,
    company_service_token,
} from '../src/companies/infrastructure/tokens/companies.tokens';
import { user_service_token } from '../src/users/infrastructure/tokens/users.tokens';
import { CompanyEntity } from '../src/companies/domain/entities/company.entity';
import { CompanyMembershipEntity } from '../src/companies/domain/entities/company-membership.entity';
import { CompanyStatus } from '../src/companies/domain/types/company-status';
import type { ICompanyRepository } from '../src/companies/domain/repositories/company.repository';
import type { ICompanyMembershipRepository } from '../src/companies/domain/repositories/company-membership.repository';
import type { IUserRepository } from '../src/users/domain/repositories/user.repository';

type SeedUser = {
    email: string;
    password: string;
    name: string;
    platformAdmin?: boolean;
    /** companySlug → role. A user can live in multiple companies. */
    memberships?: { companySlug: string; role: CompanyRole }[];
};

export const PASSWORD_DEFAULT = 'HypePass1234!';

const USERS: SeedUser[] = [
    {
        email: 'jhaider23@hotmail.com',
        password: PASSWORD_DEFAULT,
        name: 'Jhaider (Platform Admin)',
        platformAdmin: true,
    },
    // --- Stage Live ---
    {
        email: 'owner@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Ana Owner',
        memberships: [{ companySlug: 'stage-live', role: COMPANY_ROLES.OWNER }],
    },
    {
        email: 'manager@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Mario Manager',
        memberships: [{ companySlug: 'stage-live', role: COMPANY_ROLES.ADMIN }],
    },
    {
        email: 'staff@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Sara Staff',
        memberships: [{ companySlug: 'stage-live', role: COMPANY_ROLES.VIEWER }],
    },
    // scanner@ is a plain STAFF at company level. Per-event check-in rights
    // come from `event_staff_assignments` (populated by seed-staff.ts).
    {
        email: 'scanner@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Sam Scanner',
        memberships: [{ companySlug: 'stage-live', role: COMPANY_ROLES.VIEWER }],
    },
    // --- Bass Collective (second company for multi-tenancy) ---
    {
        email: 'dj@basscollective.test',
        password: PASSWORD_DEFAULT,
        name: 'Diego DJ',
        memberships: [
            { companySlug: 'bass-collective', role: COMPANY_ROLES.OWNER },
        ],
    },
    // --- Attendees ---
    {
        email: 'buyer@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Bruno Buyer',
    },
    {
        email: 'laura@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Laura Reseller',
    },
    {
        email: 'pedro@hypepass.test',
        password: PASSWORD_DEFAULT,
        name: 'Pedro Courtesy',
    },
];

type CompanySeed = {
    slug: string;
    name: string;
    legalName: string;
    taxId: string;
    contactEmail: string;
};

export const COMPANIES: CompanySeed[] = [
    {
        slug: 'stage-live',
        name: 'Stage Live Producciones',
        legalName: 'Stage Live S.A.S.',
        taxId: '900.123.456-7',
        contactEmail: 'contacto@stage.live',
    },
    {
        slug: 'bass-collective',
        name: 'Bass Collective',
        legalName: 'Bass Collective S.A.S.',
        taxId: '901.234.567-8',
        contactEmail: 'hola@basscollective.co',
    },
];

async function main() {
    process.env.SWEEPER_ENABLED = 'false';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    const auth = app.get<any>(BETTER_AUTH);
    const userRepo = app.get<IUserRepository>(user_service_token);
    const companyRepo = app.get<ICompanyRepository>(company_service_token);
    const membershipRepo = app.get<ICompanyMembershipRepository>(
        company_membership_service_token,
    );
    const dataSource = app.get(DataSource);

    console.log('→ Seeding users…');

    // 1. Better Auth accounts
    for (const u of USERS) {
        const existing = await userRepo.findByEmail(u.email);
        if (existing) {
            console.log(`  · ${u.email} already exists, skipping`);
            continue;
        }
        try {
            await auth.api.signUpEmail({
                body: { email: u.email, password: u.password, name: u.name },
                asResponse: false,
            });
            console.log(`  ✓ created ${u.email}`);
        } catch (err: any) {
            console.error(
                `  ✗ failed to create ${u.email}: ${err?.message ?? err}`,
            );
        }
    }

    // 2. Platform admins (raw DB update — Better Auth's admin plugin
    //    setRole() requires an admin session which we don't have here).
    for (const u of USERS.filter((x) => x.platformAdmin)) {
        await dataSource.query(
            `UPDATE "user" SET "role" = 'platform_admin' WHERE "email" = $1`,
            [u.email],
        );
        console.log(`  ✓ promoted ${u.email} to platform_admin`);
    }

    // 3. Companies (ACTIVE so owners can draft events right away)
    const companyBySlug: Record<string, string> = {};
    for (const c of COMPANIES) {
        let company = await companyRepo.findBySlug(c.slug);
        if (!company) {
            company = await companyRepo.create(
                new CompanyEntity({
                    slug: c.slug,
                    name: c.name,
                    legalName: c.legalName,
                    taxId: c.taxId,
                    contactEmail: c.contactEmail,
                    status: CompanyStatus.ACTIVE,
                    reviewedAt: new Date(),
                    reviewNotes: 'Auto-approved by seed script',
                }),
            );
            console.log(`  ✓ company "${company.name}" created`);
        } else if (company.status !== CompanyStatus.ACTIVE) {
            await companyRepo.update(
                new CompanyEntity({
                    ...company,
                    id: company.id,
                    createdAt: company.createdAt,
                    status: CompanyStatus.ACTIVE,
                    reviewedAt: new Date(),
                    updatedAt: new Date(),
                } as any),
            );
            console.log(`  ✓ company "${company.name}" promoted to ACTIVE`);
        } else {
            console.log(`  · company "${company.name}" already ACTIVE`);
        }
        companyBySlug[c.slug] = company.id;
    }

    // 4. Memberships
    for (const u of USERS) {
        if (!u.memberships?.length) continue;
        const user = await userRepo.findByEmail(u.email);
        if (!user) {
            console.warn(`  ! ${u.email} not found — skipping memberships`);
            continue;
        }
        for (const m of u.memberships) {
            const companyId = companyBySlug[m.companySlug];
            if (!companyId) {
                console.warn(
                    `  ! company "${m.companySlug}" not found for ${u.email}`,
                );
                continue;
            }
            const existing = await membershipRepo.findOne(companyId, user.id);
            if (existing) {
                if (existing.role !== m.role) {
                    await membershipRepo.delete(existing.id);
                    await membershipRepo.create(
                        new CompanyMembershipEntity({
                            companyId,
                            userId: user.id,
                            role: m.role,
                        }),
                    );
                    console.log(
                        `  ↻ ${u.email} role updated to ${m.role} @ ${m.companySlug}`,
                    );
                } else {
                    console.log(
                        `  · ${u.email} already ${m.role} @ ${m.companySlug}`,
                    );
                }
            } else {
                await membershipRepo.create(
                    new CompanyMembershipEntity({
                        companyId,
                        userId: user.id,
                        role: m.role,
                    }),
                );
                console.log(`  ✓ ${u.email} → ${m.role} @ ${m.companySlug}`);
            }
        }
    }

    console.log('\n✓ Users + companies seed complete.');
    console.log(`  password for every user: ${PASSWORD_DEFAULT}`);
    for (const u of USERS) {
        const tag = u.platformAdmin
            ? '[platform_admin]'
            : u.memberships
              ? `[${u.memberships.map((m) => `${m.role}@${m.companySlug}`).join(', ')}]`
              : '[user]';
        console.log(`  ${u.email.padEnd(30)} ${tag}`);
    }

    await app.close();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
