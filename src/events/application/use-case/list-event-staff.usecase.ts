import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventStaffRepository } from '../../domain/repositories/event-staff.repository';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { EventStaffRole } from '../../domain/types/event-staff-role';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export type EventStaffListItem = {
    id: string;
    userId: string;
    email: string;
    name: string;
    role: EventStaffRole;
    note: string | null;
    assignedByUserId: string;
    createdAt: Date;
};

export class ListEventStaffUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly staffRepo: IEventStaffRepository,
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
    ): Promise<EventStaffListItem[]> {
        const event = await assertEventInCompany(
            this.eventRepo,
            companyId,
            eventId,
        );
        const assignments = await this.staffRepo.findByEvent(event.id);

        // Resolve user email/name in one pass (N users per event — small N).
        const items: EventStaffListItem[] = [];
        for (const a of assignments) {
            const u = await this.userRepo.findById(a.userId);
            items.push({
                id: a.id,
                userId: a.userId,
                email: u?.email ?? '(unknown)',
                name: u?.name ?? '(unknown)',
                role: a.role,
                note: a.note,
                assignedByUserId: a.assignedByUserId,
                createdAt: a.createdAt ?? new Date(0),
            });
        }
        return items;
    }
}
