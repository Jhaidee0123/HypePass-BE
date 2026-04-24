import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { EventEntity } from '../../../domain/entities/event.entity';
import { EventSessionEntity } from '../../../domain/entities/event-session.entity';
import { TicketSectionEntity } from '../../../domain/entities/ticket-section.entity';
import { TicketSalePhaseEntity } from '../../../domain/entities/ticket-sale-phase.entity';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../../domain/repositories/ticket-sale-phase.repository';

/** Throws unless the event belongs to companyId. */
export async function assertEventInCompany(
    eventRepo: IEventRepository,
    companyId: string,
    eventId: string,
): Promise<EventEntity> {
    const event = await eventRepo.findById(eventId);
    if (!event) throw new NotFoundDomainException('Event not found');
    if (event.companyId !== companyId) {
        throw new ForbiddenDomainException(
            'Event does not belong to this company',
        );
    }
    return event;
}

/** Walks session → event → company and throws if the hierarchy is broken. */
export async function assertSessionInEventCompany(
    eventRepo: IEventRepository,
    sessionRepo: IEventSessionRepository,
    companyId: string,
    eventId: string,
    sessionId: string,
): Promise<{ event: EventEntity; session: EventSessionEntity }> {
    const event = await assertEventInCompany(eventRepo, companyId, eventId);
    const session = await sessionRepo.findById(sessionId);
    if (!session) throw new NotFoundDomainException('Session not found');
    if (session.eventId !== event.id) {
        throw new ForbiddenDomainException(
            'Session does not belong to this event',
        );
    }
    return { event, session };
}

export async function assertSectionInSessionHierarchy(
    eventRepo: IEventRepository,
    sessionRepo: IEventSessionRepository,
    sectionRepo: ITicketSectionRepository,
    companyId: string,
    eventId: string,
    sessionId: string,
    sectionId: string,
): Promise<{
    event: EventEntity;
    session: EventSessionEntity;
    section: TicketSectionEntity;
}> {
    const { event, session } = await assertSessionInEventCompany(
        eventRepo,
        sessionRepo,
        companyId,
        eventId,
        sessionId,
    );
    const section = await sectionRepo.findById(sectionId);
    if (!section) throw new NotFoundDomainException('Section not found');
    if (section.eventSessionId !== session.id) {
        throw new ForbiddenDomainException(
            'Section does not belong to this session',
        );
    }
    return { event, session, section };
}

export async function assertPhaseInSectionHierarchy(
    eventRepo: IEventRepository,
    sessionRepo: IEventSessionRepository,
    sectionRepo: ITicketSectionRepository,
    phaseRepo: ITicketSalePhaseRepository,
    companyId: string,
    eventId: string,
    sessionId: string,
    sectionId: string,
    phaseId: string,
): Promise<{
    event: EventEntity;
    session: EventSessionEntity;
    section: TicketSectionEntity;
    phase: TicketSalePhaseEntity;
}> {
    const { event, session, section } = await assertSectionInSessionHierarchy(
        eventRepo,
        sessionRepo,
        sectionRepo,
        companyId,
        eventId,
        sessionId,
        sectionId,
    );
    const phase = await phaseRepo.findById(phaseId);
    if (!phase) throw new NotFoundDomainException('Sale phase not found');
    if (phase.ticketSectionId !== section.id) {
        throw new ForbiddenDomainException(
            'Phase does not belong to this section',
        );
    }
    return { event, session, section, phase };
}
