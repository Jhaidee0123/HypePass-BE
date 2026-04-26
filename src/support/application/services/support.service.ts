import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SupportTicketOrmEntity } from '../../infrastructure/orm/support-ticket.orm.entity';
import { SupportMessageOrmEntity } from '../../infrastructure/orm/support-message.orm.entity';
import {
    SupportTicketKind,
    SupportTicketStatus,
} from '../../domain/types/support.types';
import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';

export type SupportTicketRow = {
    id: string;
    createdAt: string;
    updatedAt: string;
    kind: SupportTicketKind;
    status: SupportTicketStatus;
    subject: string;
    body: string;
    userId: string | null;
    guestEmail: string | null;
    relatedOrderId: string | null;
    relatedCompanyId: string | null;
    relatedEventId: string | null;
    attachments: string[] | null;
    assignedToUserId: string | null;
    resolvedAt: string | null;
};

export type SupportMessageRow = {
    id: string;
    createdAt: string;
    ticketId: string;
    authorKind: 'user' | 'admin';
    authorUserId: string | null;
    body: string;
    attachments: string[] | null;
};

const toTicket = (orm: SupportTicketOrmEntity): SupportTicketRow => ({
    id: orm.id,
    createdAt: orm.createdAt.toISOString(),
    updatedAt: orm.updatedAt.toISOString(),
    kind: orm.kind,
    status: orm.status,
    subject: orm.subject,
    body: orm.body,
    userId: orm.userId,
    guestEmail: orm.guestEmail,
    relatedOrderId: orm.relatedOrderId,
    relatedCompanyId: orm.relatedCompanyId,
    relatedEventId: orm.relatedEventId,
    attachments: orm.attachments,
    assignedToUserId: orm.assignedToUserId,
    resolvedAt: orm.resolvedAt ? orm.resolvedAt.toISOString() : null,
});

const toMessage = (orm: SupportMessageOrmEntity): SupportMessageRow => ({
    id: orm.id,
    createdAt: orm.createdAt.toISOString(),
    ticketId: orm.ticketId,
    authorKind: orm.authorKind,
    authorUserId: orm.authorUserId,
    body: orm.body,
    attachments: orm.attachments,
});

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportTicketOrmEntity)
        private readonly tickets: Repository<SupportTicketOrmEntity>,
        @InjectRepository(SupportMessageOrmEntity)
        private readonly messages: Repository<SupportMessageOrmEntity>,
    ) {}

    async create(input: {
        kind: SupportTicketKind;
        subject: string;
        body: string;
        userId: string | null;
        guestEmail: string | null;
        relatedOrderId?: string | null;
        relatedCompanyId?: string | null;
        relatedEventId?: string | null;
        attachments?: string[] | null;
    }): Promise<SupportTicketRow> {
        const id = randomUUID();
        await this.tickets.insert({
            id,
            kind: input.kind,
            status: 'open',
            subject: input.subject.slice(0, 200),
            body: input.body.slice(0, 5000),
            userId: input.userId,
            guestEmail: input.guestEmail,
            relatedOrderId: input.relatedOrderId ?? null,
            relatedCompanyId: input.relatedCompanyId ?? null,
            relatedEventId: input.relatedEventId ?? null,
            attachments: input.attachments ?? null,
            assignedToUserId: null,
            resolvedAt: null,
        });
        const row = await this.tickets.findOneOrFail({ where: { id } });
        return toTicket(row);
    }

    async list(filter: {
        kind?: SupportTicketKind;
        status?: SupportTicketStatus;
        q?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ items: SupportTicketRow[]; total: number }> {
        const qb = this.tickets
            .createQueryBuilder('t')
            .orderBy('t.createdAt', 'DESC')
            .take(filter.limit ?? 50)
            .skip(filter.offset ?? 0);
        if (filter.kind) qb.andWhere('t.kind = :k', { k: filter.kind });
        if (filter.status) qb.andWhere('t.status = :s', { s: filter.status });
        if (filter.q) {
            qb.andWhere(
                '(t.subject ILIKE :n OR t.body ILIKE :n OR t.guest_email ILIKE :n)',
                { n: `%${filter.q}%` },
            );
        }
        const [rows, total] = await qb.getManyAndCount();
        return { items: rows.map(toTicket), total };
    }

    async getDetail(
        ticketId: string,
    ): Promise<{ ticket: SupportTicketRow; messages: SupportMessageRow[] }> {
        const t = await this.tickets.findOne({ where: { id: ticketId } });
        if (!t) throw new NotFoundDomainException(`ticket ${ticketId} not found`);
        const msgs = await this.messages.find({
            where: { ticketId },
            order: { createdAt: 'ASC' },
        });
        return { ticket: toTicket(t), messages: msgs.map(toMessage) };
    }

    async reply(
        ticketId: string,
        body: string,
        attachments: string[] | null,
        author: { kind: 'user' | 'admin'; userId: string | null },
    ): Promise<SupportMessageRow> {
        const ticket = await this.tickets.findOne({ where: { id: ticketId } });
        if (!ticket) {
            throw new NotFoundDomainException(`ticket ${ticketId} not found`);
        }
        const id = randomUUID();
        await this.messages.insert({
            id,
            ticketId,
            authorKind: author.kind,
            authorUserId: author.userId,
            body: body.slice(0, 5000),
            attachments,
        });
        // Move to in_progress on first admin reply
        if (author.kind === 'admin' && ticket.status === 'open') {
            await this.tickets.update(
                { id: ticketId },
                { status: 'in_progress', assignedToUserId: author.userId },
            );
        }
        const row = await this.messages.findOneOrFail({ where: { id } });
        return toMessage(row);
    }

    async setStatus(
        ticketId: string,
        status: SupportTicketStatus,
        actorUserId: string,
    ): Promise<SupportTicketRow> {
        const ticket = await this.tickets.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundDomainException(`ticket ${ticketId} not found`);
        await this.tickets.update(
            { id: ticketId },
            {
                status,
                resolvedAt: status === 'resolved' ? new Date() : null,
                assignedToUserId: actorUserId,
            },
        );
        const next = await this.tickets.findOneOrFail({ where: { id: ticketId } });
        return toTicket(next);
    }
}

// quiet helper export-only import
void ILike;
