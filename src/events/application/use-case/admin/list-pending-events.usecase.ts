import { EventEntity } from '../../../domain/entities/event.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { EventStatus } from '../../../domain/types/event-status';

export class ListPendingEventsUseCase {
    constructor(private readonly repo: IEventRepository) {}

    execute(status?: EventStatus): Promise<EventEntity[]> {
        return this.repo.findAll({
            status: status ?? EventStatus.PENDING_REVIEW,
        });
    }
}
