import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../domain/repositories/ticket-sale-phase.repository';
import { assertPhaseInSectionHierarchy } from './helpers/assert-event-ownership';

export class DeletePhaseUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
        sectionId: string,
        phaseId: string,
    ): Promise<void> {
        await assertPhaseInSectionHierarchy(
            this.eventRepo,
            this.sessionRepo,
            this.sectionRepo,
            this.phaseRepo,
            companyId,
            eventId,
            sessionId,
            sectionId,
            phaseId,
        );
        await this.phaseRepo.delete(phaseId);
    }
}
