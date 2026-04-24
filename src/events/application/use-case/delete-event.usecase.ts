import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { EventStatus } from '../../domain/types/event-status';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class DeleteEventUseCase {
    constructor(private readonly repo: IEventRepository) {}

    async execute(companyId: string, eventId: string): Promise<void> {
        const event = await assertEventInCompany(
            this.repo,
            companyId,
            eventId,
        );
        if (event.status === EventStatus.PUBLISHED) {
            throw new UnprocessableDomainException(
                'Unpublish the event before deleting it',
                'EVENT_PUBLISHED',
            );
        }
        await this.repo.delete(eventId);
    }
}
