import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventStaffRepository } from '../../domain/repositories/event-staff.repository';
import { EventStatus } from '../../domain/types/event-status';

export type MyStaffEventRow = {
    eventId: string;
    title: string;
    slug: string;
    status: string;
    coverImageUrl: string | null;
    role: string;
    note: string | null;
    assignedAt: string;
};

/**
 * Self-service: events where the calling user is currently assigned as staff
 * (typically check-in). Used by the FE to decide whether to show the
 * "Check-in" link in the nav. Filters out cancelled/ended events so the
 * link disappears once the event is over.
 */
export class ListMyStaffEventsUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly staffRepo: IEventStaffRepository,
    ) {}

    async execute(userId: string): Promise<MyStaffEventRow[]> {
        const assignments = await this.staffRepo.findByUser(userId);
        if (assignments.length === 0) return [];

        const events = await Promise.all(
            assignments.map((a) => this.eventRepo.findById(a.eventId)),
        );

        const rows: MyStaffEventRow[] = [];
        assignments.forEach((a, idx) => {
            const ev = events[idx];
            if (!ev) return;
            if (
                ev.status === EventStatus.CANCELLED ||
                ev.status === EventStatus.ENDED
            ) {
                return;
            }
            rows.push({
                eventId: ev.id,
                title: ev.title,
                slug: ev.slug,
                status: ev.status,
                coverImageUrl: ev.coverImageUrl ?? null,
                role: a.role,
                note: a.note,
                assignedAt: (a.createdAt ?? new Date(0)).toISOString(),
            });
        });
        return rows;
    }
}
