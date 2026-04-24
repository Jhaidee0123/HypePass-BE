import {
    ConflictDomainException,
    UnprocessableDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { TicketSalePhaseEntity } from '../../domain/entities/ticket-sale-phase.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { ITicketSalePhaseRepository } from '../../domain/repositories/ticket-sale-phase.repository';
import { UpdateTicketSalePhaseDto } from '../dto/update-ticket-sale-phase.dto';
import { assertPhaseInSectionHierarchy } from './helpers/assert-event-ownership';
import { rangesOverlap } from './helpers/overlap';

export class UpdatePhaseUseCase {
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
        phaseId: string,
        dto: UpdateTicketSalePhaseDto,
    ): Promise<TicketSalePhaseEntity> {
        const { phase } = await assertPhaseInSectionHierarchy(
            this.eventRepo,
            this.sessionRepo,
            this.sectionRepo,
            this.phaseRepo,
            companyId,
            eventId,
            sessionId,
            sectionId,
            phaseId,
        );

        const startsAt = dto.startsAt
            ? new Date(dto.startsAt)
            : phase.startsAt;
        const endsAt = dto.endsAt ? new Date(dto.endsAt) : phase.endsAt;
        if (endsAt.getTime() <= startsAt.getTime()) {
            throw new UnprocessableDomainException(
                'endsAt must be after startsAt',
                'PHASE_BAD_TIME_RANGE',
            );
        }

        if (dto.startsAt || dto.endsAt) {
            const siblings = (
                await this.phaseRepo.findBySection(sectionId)
            ).filter((p) => p.id !== phase.id);
            const overlap = siblings.find((s) =>
                rangesOverlap(startsAt, endsAt, s.startsAt, s.endsAt),
            );
            if (overlap) {
                throw new ConflictDomainException(
                    `Phase overlaps with existing phase "${overlap.name}"`,
                    'PHASE_OVERLAP',
                );
            }
        }

        const next = new TicketSalePhaseEntity({
            id: phase.id,
            createdAt: phase.createdAt,
            ticketSectionId: phase.ticketSectionId,
            name: dto.name ?? phase.name,
            startsAt,
            endsAt,
            price: dto.price ?? phase.price,
            currency: dto.currency ?? phase.currency,
            serviceFee: dto.serviceFee ?? phase.serviceFee,
            platformFee: dto.platformFee ?? phase.platformFee,
            taxAmount: dto.taxAmount ?? phase.taxAmount,
            maxPerOrder: dto.maxPerOrder ?? phase.maxPerOrder,
            maxPerUser: dto.maxPerUser ?? phase.maxPerUser,
            sortOrder: dto.sortOrder ?? phase.sortOrder,
            isActive: dto.isActive ?? phase.isActive,
            updatedAt: new Date(),
        });
        return this.phaseRepo.update(next);
    }
}
