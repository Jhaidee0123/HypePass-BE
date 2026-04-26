import { EventEntity } from '../../../domain/entities/event.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { EventStatus } from '../../../domain/types/event-status';

export type AdminListEventsFilter = {
    status?: EventStatus;
    companyId?: string;
    search?: string;
};

export class AdminListEventsUseCase {
    constructor(private readonly repo: IEventRepository) {}

    execute(filter: AdminListEventsFilter): Promise<EventEntity[]> {
        return this.repo.findAll({
            status: filter.status,
            companyId: filter.companyId,
            search: filter.search,
        });
    }
}
