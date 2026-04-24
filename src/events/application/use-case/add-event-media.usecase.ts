import { EventMediaEntity } from '../../domain/entities/event-media.entity';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventMediaRepository } from '../../domain/repositories/event-media.repository';
import { AddEventMediaDto } from '../dto/add-event-media.dto';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class AddEventMediaUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly mediaRepo: IEventMediaRepository,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        dto: AddEventMediaDto,
    ): Promise<EventMediaEntity> {
        await assertEventInCompany(this.eventRepo, companyId, eventId);
        const media = new EventMediaEntity({
            eventId,
            url: dto.url,
            publicId: dto.publicId ?? null,
            type: dto.type,
            sortOrder: dto.sortOrder ?? 0,
            alt: dto.alt ?? null,
        });
        return this.mediaRepo.create(media);
    }
}
