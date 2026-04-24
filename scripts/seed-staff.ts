/**
 * Seed per-event staff assignments. Assigns scanner@hypepass.test as
 * checkin_staff of the "live-now-warehouse" event so they can immediately
 * open /checkin and scan the tickets issued by seed-tickets.
 *
 * Idempotent: uses findOne(eventId, userId, role) before inserting.
 *
 * Usage:
 *   yarn db:seed-staff
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EventStaffEntity } from '../src/events/domain/entities/event-staff.entity';
import { EventStaffRole } from '../src/events/domain/types/event-staff-role';
import {
    event_service_token,
    event_staff_service_token,
} from '../src/events/infrastructure/tokens/events.tokens';
import { user_service_token } from '../src/users/infrastructure/tokens/users.tokens';
import type { IEventRepository } from '../src/events/domain/repositories/event.repository';
import type { IEventStaffRepository } from '../src/events/domain/repositories/event-staff.repository';
import type { IUserRepository } from '../src/users/domain/repositories/user.repository';

type StaffAssignment = {
    eventSlug: string;
    staffEmail: string;
    assignedByEmail: string;
    role: EventStaffRole;
    note?: string;
};

const ASSIGNMENTS: StaffAssignment[] = [
    {
        eventSlug: 'live-now-warehouse',
        staffEmail: 'scanner@hypepass.test',
        assignedByEmail: 'owner@hypepass.test',
        role: EventStaffRole.CHECKIN_STAFF,
        note: 'Seed: staff principal del evento en vivo',
    },
    // También asignamos al manager como staff del festival (multi-sesión)
    // para que pueda hacer check-in de cada día.
    {
        eventSlug: 'parallax-festival-2026',
        staffEmail: 'manager@hypepass.test',
        assignedByEmail: 'owner@hypepass.test',
        role: EventStaffRole.CHECKIN_STAFF,
        note: 'Seed: manager con acceso a check-in del festival',
    },
];

async function main() {
    process.env.SWEEPER_ENABLED = 'false';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    const userRepo = app.get<IUserRepository>(user_service_token);
    const eventRepo = app.get<IEventRepository>(event_service_token);
    const staffRepo = app.get<IEventStaffRepository>(event_staff_service_token);

    console.log('→ Seeding event staff assignments…');

    for (const a of ASSIGNMENTS) {
        const event = await eventRepo.findBySlug(a.eventSlug);
        if (!event) {
            console.warn(`  ! event ${a.eventSlug} not found, skipping`);
            continue;
        }
        const staff = await userRepo.findByEmail(a.staffEmail);
        if (!staff) {
            console.warn(`  ! user ${a.staffEmail} not found, skipping`);
            continue;
        }
        const actor = await userRepo.findByEmail(a.assignedByEmail);
        if (!actor) {
            console.warn(
                `  ! actor ${a.assignedByEmail} not found, skipping`,
            );
            continue;
        }

        const existing = await staffRepo.findOne(event.id, staff.id, a.role);
        if (existing) {
            console.log(
                `  · ${a.staffEmail} already ${a.role} @ ${a.eventSlug}`,
            );
            continue;
        }

        await staffRepo.create(
            new EventStaffEntity({
                eventId: event.id,
                userId: staff.id,
                role: a.role,
                assignedByUserId: actor.id,
                note: a.note ?? null,
            }),
        );
        console.log(
            `  ✓ ${a.staffEmail} → ${a.role} @ ${a.eventSlug} (by ${a.assignedByEmail})`,
        );
    }

    console.log('\n✓ Staff seed complete.');

    await app.close();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
