import { NotFoundDomainException } from '../../../../shared/infrastructure/filters/domain.exception';
import { ICategoryRepository } from '../../../../categories/domain/repositories/category.repository';
import { IVenueRepository } from '../../../../venues/domain/repositories/venue.repository';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../../domain/repositories/ticket-sale-phase.repository';
import { EventStatus } from '../../../domain/types/event-status';
import { PublicEventDetail } from './public-event-types';

export class GetPublicEventUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
        private readonly categoryRepo: ICategoryRepository,
        private readonly venueRepo: IVenueRepository,
    ) {}

    async execute(slug: string): Promise<PublicEventDetail> {
        const event = await this.eventRepo.findBySlug(slug);
        if (!event || event.status !== EventStatus.PUBLISHED) {
            throw new NotFoundDomainException('Event not found');
        }

        const [category, venue, sessions] = await Promise.all([
            event.categoryId
                ? this.categoryRepo.findById(event.categoryId)
                : Promise.resolve(null),
            event.venueId
                ? this.venueRepo.findById(event.venueId)
                : Promise.resolve(null),
            this.sessionRepo.findByEvent(event.id),
        ]);

        const now = new Date();
        const decoratedSessions = await Promise.all(
            sessions.map(async (session) => {
                const sections =
                    await this.sectionRepo.findByEventSession(session.id);
                const decoratedSections = await Promise.all(
                    sections.map(async (section) => {
                        const phases = await this.phaseRepo.findBySection(
                            section.id,
                        );
                        const phasesWithState = phases.map((p) =>
                            Object.assign(p, {
                                isOpenNow: p.isOpenAt(now),
                            }),
                        );
                        const currentPhase =
                            phasesWithState.find((p) => p.isOpenNow) ?? null;
                        return Object.assign(section, {
                            phases: phasesWithState,
                            currentPhase,
                        });
                    }),
                );
                return Object.assign(session, { sections: decoratedSections });
            }),
        );

        const isPast =
            sessions.length > 0 &&
            sessions.every((s) => s.endsAt.getTime() <= now.getTime());

        return {
            event,
            category,
            venue,
            sessions: decoratedSessions as PublicEventDetail['sessions'],
            isPast,
        };
    }
}
