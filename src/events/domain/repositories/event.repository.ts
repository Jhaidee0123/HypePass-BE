import { IBaseRepository } from '../../../shared/domain/repositories/base.repository';
import { EventEntity } from '../entities/event.entity';
import { EventQueryFilter } from '../types/event-query-filter';

export interface IEventRepository
    extends IBaseRepository<EventEntity, EventQueryFilter> {
    findBySlug(slug: string): Promise<EventEntity | null>;
}
