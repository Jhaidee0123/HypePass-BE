import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { TicketSalePhaseEntity } from '../../domain/entities/ticket-sale-phase.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../domain/repositories/ticket-sale-phase.repository';
import { CreateTicketSalePhaseDto } from '../dto/create-ticket-sale-phase.dto';
import { assertSectionInSessionHierarchy } from './helpers/assert-event-ownership';
import { rangesOverlap } from './helpers/overlap';

export class CreatePhaseUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
        private readonly phaseRepo: ITicketSalePhaseRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
        sectionId: string,
        dto: CreateTicketSalePhaseDto,
    ): Promise<TicketSalePhaseEntity> {
        await assertSectionInSessionHierarchy(
            this.eventRepo,
            this.sessionRepo,
            this.sectionRepo,
            companyId,
            eventId,
            sessionId,
            sectionId,
        );

        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        if (endsAt.getTime() <= startsAt.getTime()) {
            throw new UnprocessableDomainException(
                'endsAt must be after startsAt',
                'PHASE_BAD_TIME_RANGE',
            );
        }

        const existing = await this.phaseRepo.findBySection(sectionId);
        const overlapping = existing.find((p) =>
            rangesOverlap(startsAt, endsAt, p.startsAt, p.endsAt),
        );
        if (overlapping) {
            throw new ConflictDomainException(
                `Phase "${dto.name}" overlaps with existing phase "${overlapping.name}"`,
                'PHASE_OVERLAP',
            );
        }

        const phase = new TicketSalePhaseEntity({
            ticketSectionId: sectionId,
            name: dto.name,
            startsAt,
            endsAt,
            price: dto.price,
            currency: dto.currency ?? 'COP',
            serviceFee: dto.serviceFee ?? null,
            platformFee: dto.platformFee ?? null,
            taxAmount: dto.taxAmount ?? null,
            maxPerOrder: dto.maxPerOrder ?? null,
            maxPerUser: dto.maxPerUser ?? null,
            sortOrder: dto.sortOrder ?? 0,
            isActive: dto.isActive ?? true,
        });
        return this.phaseRepo.create(phase);
    }
}
