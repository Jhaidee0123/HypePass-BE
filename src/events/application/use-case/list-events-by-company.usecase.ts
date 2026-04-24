import { EventEntity } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';

export class ListEventsByCompanyUseCase {
    constructor(private readonly repo: IEventRepository) {}

    execute(companyId: string): Promise<EventEntity[]> {
        return this.repo.findAll({ companyId });
    }
}
