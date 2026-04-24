import { NotFoundDomainException } from '../../../../shared/infrastructure/filters/domain.exception';
import { EventEntity } from '../../../domain/entities/event.entity';
import { EventSessionEntity } from '../../../domain/entities/event-session.entity';
import { TicketSectionEntity } from '../../../domain/entities/ticket-section.entity';
import { TicketSalePhaseEntity } from '../../../domain/entities/ticket-sale-phase.entity';
import { EventMediaEntity } from '../../../domain/entities/event-media.entity';
import { EventPublicationReviewEntity } from '../../../domain/entities/event-publication-review.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../../domain/repositories/ticket-sale-phase.repository';
import { IEventMediaRepository } from '../../../domain/repositories/event-media.repository';
import { IEventPublicationReviewRepository } from '../../../domain/repositories/event-publication-review.repository';

export type EventForReview = {
    event: EventEntity;
    sessions: Array<
        EventSessionEntity & {
            sections: Array<
                TicketSectionEntity & { phases: TicketSalePhaseEntity[] }
            >;
        }
    >;
    media: EventMediaEntity[];
    reviews: EventPublicationReviewEntity[];
};

export class GetEventForReviewUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
        private readonly mediaRepo: IEventMediaRepository,
        private readonly reviewRepo: IEventPublicationReviewRepository,
    ) {}

    async execute(eventId: string): Promise<EventForReview> {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new NotFoundDomainException('Event not found');

        const sessions = await this.sessionRepo.findByEvent(event.id);
        const media = await this.mediaRepo.findByEvent(event.id);
        const reviews = await this.reviewRepo.findByEvent(event.id);

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
                return Object.assign(session, {
                    sections: decoratedSections,
                });
            }),
        );

        return {
            event,
            sessions: decoratedSessions as EventForReview['sessions'],
            media,
            reviews,
        };
    }
}
