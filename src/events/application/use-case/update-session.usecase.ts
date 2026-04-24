import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { EventSessionEntity } from '../../domain/entities/event-session.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventSessionRepository } from '../../domain/repositories/event-session.repository';
import { UpdateEventSessionDto } from '../dto/update-event-session.dto';
import { assertSessionInEventCompany } from './helpers/assert-event-ownership';

export class UpdateSessionUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly sessionRepo: IEventSessionRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        sessionId: string,
        dto: UpdateEventSessionDto,
    ): Promise<EventSessionEntity> {
        const { session } = await assertSessionInEventCompany(
            this.eventRepo,
            this.sessionRepo,
            companyId,
            eventId,
            sessionId,
        );

        const startsAt = dto.startsAt
            ? new Date(dto.startsAt)
            : session.startsAt;
        const endsAt = dto.endsAt ? new Date(dto.endsAt) : session.endsAt;
        if (endsAt.getTime() <= startsAt.getTime()) {
            throw new UnprocessableDomainException(
                'endsAt must be after startsAt',
                'SESSION_BAD_TIME_RANGE',
            );
        }

        const next = new EventSessionEntity({
            id: session.id,
            createdAt: session.createdAt,
            eventId: session.eventId,
            name: dto.name ?? session.name,
            startsAt,
            endsAt,
            timezone: dto.timezone ?? session.timezone,
            salesStartAt:
                dto.salesStartAt !== undefined
                    ? dto.salesStartAt
                        ? new Date(dto.salesStartAt)
                        : null
                    : session.salesStartAt,
            salesEndAt:
                dto.salesEndAt !== undefined
                    ? dto.salesEndAt
                        ? new Date(dto.salesEndAt)
                        : null
                    : session.salesEndAt,
            doorsOpenAt:
                dto.doorsOpenAt !== undefined
                    ? dto.doorsOpenAt
                        ? new Date(dto.doorsOpenAt)
                        : null
                    : session.doorsOpenAt,
            checkinStartAt:
                dto.checkinStartAt !== undefined
                    ? dto.checkinStartAt
                        ? new Date(dto.checkinStartAt)
                        : null
                    : session.checkinStartAt,
            transferCutoffAt:
                dto.transferCutoffAt !== undefined
                    ? dto.transferCutoffAt
                        ? new Date(dto.transferCutoffAt)
                        : null
                    : session.transferCutoffAt,
            resaleCutoffAt:
                dto.resaleCutoffAt !== undefined
                    ? dto.resaleCutoffAt
                        ? new Date(dto.resaleCutoffAt)
                        : null
                    : session.resaleCutoffAt,
            qrVisibleFrom:
                dto.qrVisibleFrom !== undefined
                    ? dto.qrVisibleFrom
                        ? new Date(dto.qrVisibleFrom)
                        : null
                    : session.qrVisibleFrom,
            status: session.status,
            updatedAt: new Date(),
        });
        return this.sessionRepo.update(next);
    }
}
