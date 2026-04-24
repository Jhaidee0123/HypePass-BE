import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { TicketSectionEntity } from '../../domain/entities/ticket-section.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { UpdateTicketSectionDto } from '../dto/update-ticket-section.dto';
import { assertSectionInSessionHierarchy } from './helpers/assert-event-ownership';

export class UpdateSectionUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
        sectionId: string,
        dto: UpdateTicketSectionDto,
    ): Promise<TicketSectionEntity> {
        const { section } = await assertSectionInSessionHierarchy(
            this.eventRepo,
            this.sessionRepo,
            this.sectionRepo,
            companyId,
            eventId,
            sessionId,
            sectionId,
        );

        const minPerOrder = dto.minPerOrder ?? section.minPerOrder;
        const maxPerOrder = dto.maxPerOrder ?? section.maxPerOrder;
        if (maxPerOrder < minPerOrder) {
            throw new UnprocessableDomainException(
                'maxPerOrder must be >= minPerOrder',
                'SECTION_BAD_ORDER_LIMITS',
            );
        }

        const next = new TicketSectionEntity({
            id: section.id,
            createdAt: section.createdAt,
            eventSessionId: section.eventSessionId,
            name: dto.name ?? section.name,
            description: dto.description ?? section.description,
            totalInventory: dto.totalInventory ?? section.totalInventory,
            minPerOrder,
            maxPerOrder,
            resaleAllowed: dto.resaleAllowed ?? section.resaleAllowed,
            transferAllowed: dto.transferAllowed ?? section.transferAllowed,
            status: section.status,
            sortOrder: dto.sortOrder ?? section.sortOrder,
            updatedAt: new Date(),
        });
        return this.sectionRepo.update(next);
    }
}
