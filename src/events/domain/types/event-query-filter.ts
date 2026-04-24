import { EventStatus } from './event-status';

export interface EventQueryFilter {
    companyId?: string;
    categoryId?: string;
    status?: EventStatus;
    search?: string;
}
