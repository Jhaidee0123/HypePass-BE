import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { assertSessionInEventCompany } from './helpers/assert-event-ownership';

export class DeleteSessionUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
    ): Promise<void> {
        await assertSessionInEventCompany(
            this.eventRepo,
            this.sessionRepo,
            companyId,
            eventId,
            sessionId,
        );
        await this.sessionRepo.delete(sessionId);
    }
}
