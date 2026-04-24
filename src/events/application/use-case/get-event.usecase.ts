import { EventEntity } from '../../domain/entities/event.entity';
import { EventSessionEntity } from '../../domain/entities/event-session.entity';
import { TicketSectionEntity } from '../../domain/entities/ticket-section.entity';
import { TicketSalePhaseEntity } from '../../domain/entities/ticket-sale-phase.entity';
import { EventMediaEntity } from '../../domain/entities/event-media.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../domain/repositories/ticket-sale-phase.repository';
import { IEventMediaRepository } from '../../domain/repositories/event-media.repository';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export type EventWithChildren = {
    event: EventEntity;
    sessions: Array<
        EventSessionEntity & {
            sections: Array<TicketSectionEntity & { phases: TicketSalePhaseEntity[] }>;
        }
    >;
    media: EventMediaEntity[];
};

export class GetEventUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
        private readonly mediaRepo: IEventMediaRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
    ): Promise<EventWithChildren> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        const sessions = await this.sessionRepo.findByEvent(event.id);
        const media = await this.mediaRepo.findByEvent(event.id);

        const decoratedSessions = await Promise.all(
            sessions.map(async (session) => {
                const sections = await this.sectionRepo.findByEventSession(
                    session.id,
                );
                const decoratedSections = await Promise.all(
                    sections.map(async (section) => {
                        const phases = await this.phaseRepo.findBySection(
                            section.id,
                        );
                        return Object.assign(section, { phases });
                    }),
                );
                return Object.assign(session, { sections: decoratedSections });
            }),
        );

        return {
            event,
            sessions: decoratedSessions as EventWithChildren['sessions'],
            media,
        };
    }
}
