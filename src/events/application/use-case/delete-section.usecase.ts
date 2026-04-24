import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { assertSectionInSessionHierarchy } from './helpers/assert-event-ownership';

export class DeleteSectionUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
        sectionId: string,
    ): Promise<void> {
        await assertSectionInSessionHierarchy(
            this.eventRepo,
            this.sessionRepo,
            this.sectionRepo,
            companyId,
            eventId,
            sessionId,
            sectionId,
        );
        await this.sectionRepo.delete(sectionId);
    }
}
