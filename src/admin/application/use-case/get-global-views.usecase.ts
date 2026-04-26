import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type CourtesyRow = {
    ticketId: string;
    createdAt: string;
    eventId: string;
    eventTitle: string;
    eventSlug: string;
    sectionName: string | null;
    ownerUserId: string;
    ownerEmail: string | null;
    ownerName: string | null;
    status: string;
    faceValue: number;
    currency: string;
};

export type StaffAssignmentRow = {
    id: string;
    createdAt: string;
    eventId: string;
    eventTitle: string;
    eventSlug: string;
    role: string;
    userId: string;
    userEmail: string | null;
    userName: string | null;
    note: string | null;
    assignedByUserId: string;
};

@Injectable()
export class GetGlobalViewsUseCase {
    constructor(private readonly ds: DataSource) {}

    async listCourtesies(limit = 200): Promise<CourtesyRow[]> {
        const rows = await this.ds.query<
            Array<{
                ticket_id: string;
                created_at: Date;
                event_id: string;
                event_title: string;
                event_slug: string;
                section_name: string | null;
                owner_user_id: string;
                owner_email: string | null;
                owner_name: string | null;
                status: string;
                face_value: number;
                currency: string;
            }>
        >(
            `SELECT
                t.id AS ticket_id,
                t.created_at,
                t.event_id,
                e.title AS event_title,
                e.slug AS event_slug,
                ts.name AS section_name,
                t.current_owner_user_id AS owner_user_id,
                u.email AS owner_email,
                u.name AS owner_name,
                t.status,
                t.face_value,
                t.currency
             FROM tickets t
             JOIN events e ON e.id = t.event_id
             LEFT JOIN ticket_sections ts ON ts.id = t.ticket_section_id
             LEFT JOIN "user" u ON u.id = t.current_owner_user_id
             WHERE t.courtesy = true
             ORDER BY t.created_at DESC
             LIMIT $1`,
            [limit],
        );
        return rows.map((r) => ({
            ticketId: r.ticket_id,
            createdAt: r.created_at.toISOString(),
            eventId: r.event_id,
            eventTitle: r.event_title,
            eventSlug: r.event_slug,
            sectionName: r.section_name,
            ownerUserId: r.owner_user_id,
            ownerEmail: r.owner_email,
            ownerName: r.owner_name,
            status: r.status,
            faceValue: r.face_value,
            currency: r.currency,
        }));
    }

    async listStaffAssignments(limit = 300): Promise<StaffAssignmentRow[]> {
        const rows = await this.ds.query<
            Array<{
                id: string;
                created_at: Date;
                event_id: string;
                event_title: string;
                event_slug: string;
                role: string;
                user_id: string;
                user_email: string | null;
                user_name: string | null;
                note: string | null;
                assigned_by_user_id: string;
            }>
        >(
            `SELECT
                s.id,
                s.created_at,
                s.event_id,
                e.title AS event_title,
                e.slug AS event_slug,
                s.role,
                s.user_id,
                u.email AS user_email,
                u.name AS user_name,
                s.note,
                s.assigned_by_user_id
             FROM event_staff_assignments s
             JOIN events e ON e.id = s.event_id
             LEFT JOIN "user" u ON u.id = s.user_id
             ORDER BY s.created_at DESC
             LIMIT $1`,
            [limit],
        );
        return rows.map((r) => ({
            id: r.id,
            createdAt: r.created_at.toISOString(),
            eventId: r.event_id,
            eventTitle: r.event_title,
            eventSlug: r.event_slug,
            role: r.role,
            userId: r.user_id,
            userEmail: r.user_email,
            userName: r.user_name,
            note: r.note,
            assignedByUserId: r.assigned_by_user_id,
        }));
    }
}
