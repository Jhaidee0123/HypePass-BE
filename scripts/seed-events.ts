/**
 * Seed events for local testing. Requires `yarn db:seed-users` first.
 *
 * Timestamps are computed relative to `now` so every run yields a coherent
 * timeline: a live event, an upcoming one with QR already visible, a past
 * event, etc. Re-run the seed whenever you need to reset that timeline.
 *
 * Idempotent: keyed by event slug.
 *
 * Usage:
 *   yarn db:seed-events
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CategoryEntity } from '../src/categories/domain/entities/category.entity';
import { VenueEntity } from '../src/venues/domain/entities/venue.entity';
import { EventEntity } from '../src/events/domain/entities/event.entity';
import { EventSessionEntity } from '../src/events/domain/entities/event-session.entity';
import { TicketSectionEntity } from '../src/events/domain/entities/ticket-section.entity';
import { TicketSalePhaseEntity } from '../src/events/domain/entities/ticket-sale-phase.entity';
import { EventStatus } from '../src/events/domain/types/event-status';
import { EventSessionStatus } from '../src/events/domain/types/event-session-status';
import { TicketSectionStatus } from '../src/events/domain/types/ticket-section-status';
import {
    event_service_token,
    event_session_service_token,
    ticket_sale_phase_service_token,
    ticket_section_service_token,
} from '../src/events/infrastructure/tokens/events.tokens';
import { category_service_token } from '../src/categories/infrastructure/tokens/categories.tokens';
import { venue_service_token } from '../src/venues/infrastructure/tokens/venues.tokens';
import { company_service_token } from '../src/companies/infrastructure/tokens/companies.tokens';
import type { ICategoryRepository } from '../src/categories/domain/repositories/category.repository';
import type { IVenueRepository } from '../src/venues/domain/repositories/venue.repository';
import type { IEventRepository } from '../src/events/domain/repositories/event.repository';
import type { IEventSessionRepository } from '../src/events/domain/repositories/event-session.repository';
import type { ITicketSectionRepository } from '../src/events/domain/repositories/ticket-section.repository';
import type { ITicketSalePhaseRepository } from '../src/events/domain/repositories/ticket-sale-phase.repository';
import type { ICompanyRepository } from '../src/companies/domain/repositories/company.repository';

const DAY = 86_400_000;
const HOUR = 3_600_000;

type CategorySeed = { slug: string; name: string; sortOrder: number };

const CATEGORIES: CategorySeed[] = [
    { slug: 'musica', name: 'Música', sortOrder: 1 },
    { slug: 'festival', name: 'Festival', sortOrder: 2 },
    { slug: 'comedia', name: 'Comedia', sortOrder: 3 },
    { slug: 'electronica', name: 'Electrónica', sortOrder: 4 },
];

type VenueSeed = {
    companySlug: string;
    name: string;
    addressLine: string;
    city: string;
    region: string;
    country: string;
    capacity: number;
    description: string;
};

const VENUES: VenueSeed[] = [
    {
        companySlug: 'stage-live',
        name: 'Movistar Arena',
        addressLine: 'Cl. 26 #68B-85',
        city: 'Bogotá',
        region: 'Cundinamarca',
        country: 'CO',
        capacity: 14000,
        description: 'Venue principal de eventos masivos en Bogotá.',
    },
    {
        companySlug: 'stage-live',
        name: 'Teatro Colón',
        addressLine: 'Cl. 10 #5-32',
        city: 'Bogotá',
        region: 'Cundinamarca',
        country: 'CO',
        capacity: 900,
        description: 'Teatro histórico en el centro, acústica íntima.',
    },
    {
        companySlug: 'bass-collective',
        name: 'Club Underground',
        addressLine: 'Cra. 9 #61-35',
        city: 'Medellín',
        region: 'Antioquia',
        country: 'CO',
        capacity: 600,
        description: 'Boutique club, sound-system Funktion-One.',
    },
];

type PhaseSeed = {
    name: string;
    price: number; // COP cents
    serviceFee?: number;
    /** offset in days relative to `now` (can be negative). */
    startsOffsetDays: number;
    endsOffsetDays: number;
    isActive: boolean;
};

type SectionSeed = {
    name: string;
    description: string;
    totalInventory: number;
    minPerOrder: number;
    maxPerOrder: number;
    resaleAllowed: boolean;
    transferAllowed: boolean;
    phases: PhaseSeed[];
};

type SessionSeed = {
    name: string | null;
    /** When the session starts, relative to now (hours precision). */
    startsOffsetHours: number;
    durationHours: number;
    /** If true, qrVisibleFrom is moved to now - 2h so QR is testable right away. */
    forceQrVisibleNow?: boolean;
    sections: SectionSeed[];
};

type EventSeed = {
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    categorySlug: string;
    companySlug: string;
    venueName: string;
    coverImageSeed: string;
    bannerImageSeed: string;
    status: EventStatus;
    qrVisibleHoursBefore?: number;
    sessions: SessionSeed[];
};

// Factory helpers — keep section/phase definitions DRY.
const generalWithPhases = (
    inventory: number,
    phases: PhaseSeed[],
): SectionSeed => ({
    name: 'General',
    description: 'Acceso general, sin asiento asignado.',
    totalInventory: inventory,
    minPerOrder: 1,
    maxPerOrder: 4,
    resaleAllowed: true,
    transferAllowed: true,
    phases,
});

const vipWithPhases = (
    inventory: number,
    phases: PhaseSeed[],
): SectionSeed => ({
    name: 'VIP',
    description:
        'Zona elevada con vista directa al main stage, barra premium incluida.',
    totalInventory: inventory,
    minPerOrder: 1,
    maxPerOrder: 2,
    resaleAllowed: true,
    transferAllowed: true,
    phases,
});

export const EVENTS: EventSeed[] = [
    // ----- Event HAPPENING NOW -----
    // Session started 2h ago, ends in 4h. Check-in window open, QR visible.
    {
        slug: 'live-now-warehouse',
        title: 'Warehouse Session — En vivo ahora',
        shortDescription:
            'Sesión de electrónica en curso en el Movistar. Staff y asistentes pueden probar check-in.',
        description:
            'Evento "en vivo" del seed: la sesión ya arrancó hace 2 horas y termina en ~4. Usa este evento para probar el flujo de QR visible, check-in desde /checkin y bloqueos de transfer/resale por cutoff ya pasado.',
        categorySlug: 'electronica',
        companySlug: 'stage-live',
        venueName: 'Movistar Arena',
        coverImageSeed: 'live-now-cover',
        bannerImageSeed: 'live-now-banner',
        status: EventStatus.PUBLISHED,
        qrVisibleHoursBefore: 24,
        sessions: [
            {
                name: null,
                startsOffsetHours: -2,
                durationHours: 6,
                forceQrVisibleNow: true,
                sections: [
                    generalWithPhases(300, [
                        {
                            name: 'Última fase',
                            price: 95_000_00,
                            serviceFee: 6_000_00,
                            startsOffsetDays: -7,
                            endsOffsetDays: 0,
                            isActive: true,
                        },
                    ]),
                ],
            },
        ],
    },
    // ----- Event in 2 days, QR already visible (72h window) -----
    {
        slug: 'indie-rooftop-sunset',
        title: 'Indie Rooftop Sunset',
        shortDescription:
            'Pop indie al atardecer. QR ya disponible en tu wallet.',
        description:
            'Evento con ventana de QR extendida (72 horas antes) para que el QR ya esté visible en el seed. Útil para probar la vista del ticket con QR activo sin esperar.',
        categorySlug: 'musica',
        companySlug: 'stage-live',
        venueName: 'Teatro Colón',
        coverImageSeed: 'indie-rooftop-cover',
        bannerImageSeed: 'indie-rooftop-banner',
        status: EventStatus.PUBLISHED,
        qrVisibleHoursBefore: 72,
        sessions: [
            {
                name: null,
                startsOffsetHours: 48,
                durationHours: 4,
                sections: [
                    generalWithPhases(200, [
                        {
                            name: 'Fase única',
                            price: 70_000_00,
                            serviceFee: 5_000_00,
                            startsOffsetDays: -14,
                            endsOffsetDays: 2,
                            isActive: true,
                        },
                    ]),
                ],
            },
        ],
    },
    // ----- 3-day festival (multi-session) -----
    {
        slug: 'parallax-festival-2026',
        title: 'Parallax Festival 2026',
        shortDescription:
            'Tres noches de música con 40+ artistas en el Movistar Arena.',
        description:
            'Festival de 3 días con sesiones consecutivas. Prueba el selector de sesión en el checkout y la vista del ticket con fecha correcta por cada día.',
        categorySlug: 'festival',
        companySlug: 'stage-live',
        venueName: 'Movistar Arena',
        coverImageSeed: 'parallax-cover',
        bannerImageSeed: 'parallax-banner',
        status: EventStatus.PUBLISHED,
        qrVisibleHoursBefore: 24,
        sessions: [
            {
                name: 'Día 1 — Viernes',
                startsOffsetHours: 30 * 24,
                durationHours: 10,
                sections: [
                    generalWithPhases(500, [
                        {
                            name: 'Early Bird',
                            price: 80_000_00,
                            serviceFee: 6_000_00,
                            startsOffsetDays: -20,
                            endsOffsetDays: 10,
                            isActive: true,
                        },
                        {
                            name: 'Fase General',
                            price: 120_000_00,
                            serviceFee: 8_000_00,
                            startsOffsetDays: 10,
                            endsOffsetDays: 28,
                            isActive: true,
                        },
                    ]),
                    vipWithPhases(80, [
                        {
                            name: 'Early VIP',
                            price: 180_000_00,
                            serviceFee: 12_000_00,
                            startsOffsetDays: -20,
                            endsOffsetDays: 10,
                            isActive: true,
                        },
                        {
                            name: 'VIP General',
                            price: 260_000_00,
                            serviceFee: 16_000_00,
                            startsOffsetDays: 10,
                            endsOffsetDays: 28,
                            isActive: true,
                        },
                    ]),
                ],
            },
            {
                name: 'Día 2 — Sábado',
                startsOffsetHours: 31 * 24,
                durationHours: 10,
                sections: [
                    generalWithPhases(500, [
                        {
                            name: 'Fase única',
                            price: 120_000_00,
                            serviceFee: 8_000_00,
                            startsOffsetDays: -20,
                            endsOffsetDays: 29,
                            isActive: true,
                        },
                    ]),
                ],
            },
            {
                name: 'Día 3 — Domingo',
                startsOffsetHours: 32 * 24,
                durationHours: 10,
                sections: [
                    generalWithPhases(500, [
                        {
                            name: 'Fase única',
                            price: 120_000_00,
                            serviceFee: 8_000_00,
                            startsOffsetDays: -20,
                            endsOffsetDays: 30,
                            isActive: true,
                        },
                    ]),
                ],
            },
        ],
    },
    // ----- Regular upcoming event (stand-up) -----
    {
        slug: 'stand-up-bogota-live',
        title: 'Stand Up Bogotá Live',
        shortDescription:
            'Showcase con los cinco comediantes más vistos del año.',
        description:
            'Noche de stand up sin filtro. Cinco artistas, setlist original, sin reposiciones.',
        categorySlug: 'comedia',
        companySlug: 'stage-live',
        venueName: 'Teatro Colón',
        coverImageSeed: 'standup-cover',
        bannerImageSeed: 'standup-banner',
        status: EventStatus.PUBLISHED,
        sessions: [
            {
                name: null,
                startsOffsetHours: 12 * 24,
                durationHours: 2,
                sections: [
                    {
                        name: 'Platea',
                        description: 'Asiento numerado en platea principal.',
                        totalInventory: 200,
                        minPerOrder: 1,
                        maxPerOrder: 6,
                        resaleAllowed: true,
                        transferAllowed: true,
                        phases: [
                            {
                                name: 'Fase única',
                                price: 70_000_00,
                                serviceFee: 5_000_00,
                                startsOffsetDays: -10,
                                endsOffsetDays: 11,
                                isActive: true,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    // ----- Event from the OTHER company -----
    {
        slug: 'bass-warehouse-night',
        title: 'Bass Warehouse Night',
        shortDescription:
            'Techno industrial en Medellín con cartel europeo confirmado.',
        description:
            'Evento del segundo organizer. Úsalo para probar que cada compañía sólo ve sus propios eventos en /organizer.',
        categorySlug: 'electronica',
        companySlug: 'bass-collective',
        venueName: 'Club Underground',
        coverImageSeed: 'basswarehouse-cover',
        bannerImageSeed: 'basswarehouse-banner',
        status: EventStatus.PUBLISHED,
        sessions: [
            {
                name: null,
                startsOffsetHours: 21 * 24,
                durationHours: 6,
                sections: [
                    generalWithPhases(400, [
                        {
                            name: 'Fase única',
                            price: 110_000_00,
                            serviceFee: 8_000_00,
                            startsOffsetDays: -14,
                            endsOffsetDays: 20,
                            isActive: true,
                        },
                    ]),
                ],
            },
        ],
    },
    // ----- PENDING REVIEW (admin flow) -----
    {
        slug: 'nocturno-sessions-vol-4',
        title: 'Nocturno Sessions Vol. 4',
        shortDescription:
            'Noche íntima de dj sets con artistas emergentes. Pendiente de aprobación.',
        description:
            'Evento que acaba de ser enviado a revisión por el organizer. Úsalo para probar el flujo de aprobar/rechazar desde /admin.',
        categorySlug: 'electronica',
        companySlug: 'stage-live',
        venueName: 'Teatro Colón',
        coverImageSeed: 'nocturno-cover',
        bannerImageSeed: 'nocturno-banner',
        status: EventStatus.PENDING_REVIEW,
        sessions: [
            {
                name: null,
                startsOffsetHours: 45 * 24,
                durationHours: 4,
                sections: [
                    {
                        name: 'Entrada única',
                        description: 'Acceso general desde las 21:00.',
                        totalInventory: 120,
                        minPerOrder: 1,
                        maxPerOrder: 2,
                        resaleAllowed: true,
                        transferAllowed: true,
                        phases: [
                            {
                                name: 'Fase única',
                                price: 65_000_00,
                                serviceFee: 4_000_00,
                                startsOffsetDays: -1,
                                endsOffsetDays: 44,
                                isActive: true,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    // ----- DRAFT (editor flow) -----
    {
        slug: 'wip-test-event',
        title: 'WIP — Test Event',
        shortDescription:
            'Borrador de prueba para probar el editor del organizer.',
        description:
            'Este evento está en DRAFT. Úsalo para probar la edición desde el organizer (agregar sesiones, secciones, fases) y el flujo de submit-for-review.',
        categorySlug: 'musica',
        companySlug: 'stage-live',
        venueName: 'Movistar Arena',
        coverImageSeed: '',
        bannerImageSeed: '',
        status: EventStatus.DRAFT,
        sessions: [],
    },
    // ----- Event that already ENDED 1 week ago -----
    {
        slug: 'ended-club-session',
        title: 'Ended Club Session',
        shortDescription:
            'Evento del pasado: útil para probar la tab "Pasados" del wallet y cutoffs.',
        description:
            'La sesión terminó hace una semana. El ticket emitido para este evento ya está en estado CHECKED_IN. Transfer/resale están bloqueados por los cutoffs pasados.',
        categorySlug: 'musica',
        companySlug: 'stage-live',
        venueName: 'Teatro Colón',
        coverImageSeed: 'ended-cover',
        bannerImageSeed: 'ended-banner',
        status: EventStatus.PUBLISHED,
        qrVisibleHoursBefore: 24,
        sessions: [
            {
                name: null,
                startsOffsetHours: -7 * 24,
                durationHours: 3,
                sections: [
                    generalWithPhases(100, [
                        {
                            name: 'Fase única',
                            price: 60_000_00,
                            serviceFee: 4_000_00,
                            startsOffsetDays: -30,
                            endsOffsetDays: -8,
                            isActive: false,
                        },
                    ]),
                ],
            },
        ],
    },
];

async function main() {
    process.env.SWEEPER_ENABLED = 'false';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    const categoryRepo = app.get<ICategoryRepository>(category_service_token);
    const venueRepo = app.get<IVenueRepository>(venue_service_token);
    const companyRepo = app.get<ICompanyRepository>(company_service_token);
    const eventRepo = app.get<IEventRepository>(event_service_token);
    const sessionRepo = app.get<IEventSessionRepository>(
        event_session_service_token,
    );
    const sectionRepo = app.get<ITicketSectionRepository>(
        ticket_section_service_token,
    );
    const phaseRepo = app.get<ITicketSalePhaseRepository>(
        ticket_sale_phase_service_token,
    );

    console.log('→ Seeding events…');

    // 1. Categories
    const categoryBySlug: Record<string, string> = {};
    for (const c of CATEGORIES) {
        let cat = await categoryRepo.findBySlug(c.slug);
        if (!cat) {
            cat = await categoryRepo.create(
                new CategoryEntity({
                    name: c.name,
                    slug: c.slug,
                    icon: null,
                    sortOrder: c.sortOrder,
                    isActive: true,
                }),
            );
            console.log(`  ✓ category "${cat.name}" created`);
        } else {
            console.log(`  · category "${cat.name}" already exists`);
        }
        categoryBySlug[c.slug] = cat.id;
    }

    // 2. Companies → venues
    const companyBySlug: Record<string, string> = {};
    const venueByKey: Record<string, string> = {};
    for (const v of VENUES) {
        const company = await companyRepo.findBySlug(v.companySlug);
        if (!company) {
            console.error(
                `  ✗ company "${v.companySlug}" not found. Did you run yarn db:seed-users?`,
            );
            await app.close();
            process.exit(1);
        }
        companyBySlug[v.companySlug] = company.id;

        const venues = await venueRepo.findAll({ companyId: company.id });
        let venue = venues.find((x) => x.name === v.name);
        if (!venue) {
            venue = await venueRepo.create(
                new VenueEntity({
                    companyId: company.id,
                    name: v.name,
                    addressLine: v.addressLine,
                    city: v.city,
                    region: v.region,
                    country: v.country,
                    capacity: v.capacity,
                    description: v.description,
                }),
            );
            console.log(`  ✓ venue "${venue.name}" created (${v.city})`);
        } else {
            console.log(`  · venue "${venue.name}" already exists`);
        }
        venueByKey[`${v.companySlug}|${v.name}`] = venue.id;
    }

    // 3. Events
    const now = new Date();
    for (const seed of EVENTS) {
        const existing = await eventRepo.findBySlug(seed.slug);
        if (existing) {
            console.log(`  · event "${seed.slug}" already exists, skipping`);
            continue;
        }

        const companyId = companyBySlug[seed.companySlug];
        const categoryId = categoryBySlug[seed.categorySlug];
        const venueId = venueByKey[`${seed.companySlug}|${seed.venueName}`];
        if (!companyId || !categoryId || !venueId) {
            console.warn(
                `  ! event "${seed.slug}" skipped — missing company/category/venue`,
            );
            continue;
        }

        const isPublished = seed.status === EventStatus.PUBLISHED;
        const isPending = seed.status === EventStatus.PENDING_REVIEW;

        const event = await eventRepo.create(
            new EventEntity({
                companyId,
                categoryId,
                venueId,
                title: seed.title,
                slug: seed.slug,
                shortDescription: seed.shortDescription,
                description: seed.description,
                coverImageUrl: seed.coverImageSeed
                    ? `https://picsum.photos/seed/${seed.coverImageSeed}/1200/800`
                    : null,
                bannerImageUrl: seed.bannerImageSeed
                    ? `https://picsum.photos/seed/${seed.bannerImageSeed}/2000/900`
                    : null,
                status: seed.status,
                publicationSubmittedAt: isPending || isPublished ? now : null,
                publicationApprovedAt: isPublished ? now : null,
                resaleEnabled: true,
                transferEnabled: true,
                defaultQrVisibleHoursBefore: seed.qrVisibleHoursBefore ?? 24,
                currency: 'COP',
            }),
        );
        console.log(
            `  ✓ event "${event.title}" (${seed.status}) — ${seed.companySlug}`,
        );

        for (const sess of seed.sessions) {
            const sessionStart = new Date(
                now.getTime() + sess.startsOffsetHours * HOUR,
            );
            const sessionEnd = new Date(
                sessionStart.getTime() + sess.durationHours * HOUR,
            );
            const qrVisibleFrom = sess.forceQrVisibleNow
                ? new Date(now.getTime() - 2 * HOUR)
                : new Date(
                      sessionStart.getTime() -
                          (seed.qrVisibleHoursBefore ?? 24) * HOUR,
                  );
            const session = await sessionRepo.create(
                new EventSessionEntity({
                    eventId: event.id,
                    name: sess.name,
                    startsAt: sessionStart,
                    endsAt: sessionEnd,
                    timezone: 'America/Bogota',
                    salesStartAt: new Date(now.getTime() - 30 * DAY),
                    salesEndAt: new Date(sessionStart.getTime() - 1 * HOUR),
                    doorsOpenAt: new Date(sessionStart.getTime() - 1 * HOUR),
                    checkinStartAt: new Date(sessionStart.getTime() - 2 * HOUR),
                    transferCutoffAt: new Date(
                        sessionStart.getTime() - 6 * HOUR,
                    ),
                    resaleCutoffAt: new Date(
                        sessionStart.getTime() - 12 * HOUR,
                    ),
                    qrVisibleFrom,
                    status: EventSessionStatus.SCHEDULED,
                }),
            );

            for (const [secIdx, sec] of sess.sections.entries()) {
                const section = await sectionRepo.create(
                    new TicketSectionEntity({
                        eventSessionId: session.id,
                        name: sec.name,
                        description: sec.description,
                        totalInventory: sec.totalInventory,
                        minPerOrder: sec.minPerOrder,
                        maxPerOrder: sec.maxPerOrder,
                        resaleAllowed: sec.resaleAllowed,
                        transferAllowed: sec.transferAllowed,
                        status: TicketSectionStatus.ACTIVE,
                        sortOrder: secIdx,
                    }),
                );
                for (const [phIdx, ph] of sec.phases.entries()) {
                    await phaseRepo.create(
                        new TicketSalePhaseEntity({
                            ticketSectionId: section.id,
                            name: ph.name,
                            startsAt: new Date(
                                now.getTime() + ph.startsOffsetDays * DAY,
                            ),
                            endsAt: new Date(
                                now.getTime() + ph.endsOffsetDays * DAY,
                            ),
                            price: ph.price,
                            currency: 'COP',
                            serviceFee: ph.serviceFee ?? null,
                            platformFee: null,
                            taxAmount: null,
                            maxPerOrder: sec.maxPerOrder,
                            maxPerUser: null,
                            sortOrder: phIdx,
                            isActive: ph.isActive,
                        }),
                    );
                }
            }
        }
    }

    console.log('\n✓ Events seed complete.');
    console.log('  Next: yarn db:seed-payout-methods && yarn db:seed-tickets && yarn db:seed-staff');

    await app.close();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
