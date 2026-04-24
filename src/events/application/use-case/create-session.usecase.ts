import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { EventSessionEntity } from '../../domain/entities/event-session.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { EventSessionStatus } from '../../domain/types/event-session-status';
import { CreateEventSessionDto } from '../dto/create-event-session.dto';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class CreateSessionUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        dto: CreateEventSessionDto,
    ): Promise<EventSessionEntity> {
        await assertEventInCompany(this.eventRepo, companyId, eventId);

        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        if (endsAt.getTime() <= startsAt.getTime()) {
            throw new UnprocessableDomainException(
                'endsAt must be after startsAt',
                'SESSION_BAD_TIME_RANGE',
            );
        }

        const session = new EventSessionEntity({
            eventId,
            name: dto.name ?? null,
            startsAt,
            endsAt,
            timezone: dto.timezone,
            salesStartAt: dto.salesStartAt ? new Date(dto.salesStartAt) : null,
            salesEndAt: dto.salesEndAt ? new Date(dto.salesEndAt) : null,
            doorsOpenAt: dto.doorsOpenAt ? new Date(dto.doorsOpenAt) : null,
            checkinStartAt: dto.checkinStartAt
                ? new Date(dto.checkinStartAt)
                : null,
            transferCutoffAt: dto.transferCutoffAt
                ? new Date(dto.transferCutoffAt)
                : null,
            resaleCutoffAt: dto.resaleCutoffAt
                ? new Date(dto.resaleCutoffAt)
                : null,
            qrVisibleFrom: dto.qrVisibleFrom
                ? new Date(dto.qrVisibleFrom)
                : null,
            status: EventSessionStatus.SCHEDULED,
        });
        return this.sessionRepo.create(session);
    }
}
