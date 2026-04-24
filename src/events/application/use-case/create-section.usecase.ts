import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { TicketSectionEntity } from '../../domain/entities/ticket-section.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { ITicketSectionRepository } from '../../domain/repositories/ticket-section.repository';
import { TicketSectionStatus } from '../../domain/types/ticket-section-status';
import { CreateTicketSectionDto } from '../dto/create-ticket-section.dto';
import { assertSessionInEventCompany } from './helpers/assert-event-ownership';

export class CreateSectionUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
        private readonly sectionRepo: ITicketSectionRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
        dto: CreateTicketSectionDto,
    ): Promise<TicketSectionEntity> {
        await assertSessionInEventCompany(
            this.eventRepo,
            this.sessionRepo,
            companyId,
            eventId,
            sessionId,
        );

        const minPerOrder = dto.minPerOrder ?? 1;
        const maxPerOrder = dto.maxPerOrder ?? 8;
        if (maxPerOrder < minPerOrder) {
            throw new UnprocessableDomainException(
                'maxPerOrder must be >= minPerOrder',
                'SECTION_BAD_ORDER_LIMITS',
            );
        }

        const section = new TicketSectionEntity({
            eventSessionId: sessionId,
            name: dto.name,
            description: dto.description ?? null,
            totalInventory: dto.totalInventory,
            minPerOrder,
            maxPerOrder,
            resaleAllowed: dto.resaleAllowed ?? true,
            transferAllowed: dto.transferAllowed ?? true,
            status: TicketSectionStatus.ACTIVE,
            sortOrder: dto.sortOrder ?? 0,
        });
        return this.sectionRepo.create(section);
    }
}
