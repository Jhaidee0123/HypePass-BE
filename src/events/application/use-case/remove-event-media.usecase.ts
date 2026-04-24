import {
    ForbiddenDomainException,
    NotFoundDomainException,
} from '../../../shared/infrastructure/filters/domain.exception';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IEventMediaRepository } from '../../domain/repositories/event-media.repository';
import { CloudinaryService } from '../../../shared/infrastructure/services/cloudinary.service';
import { assertEventInCompany } from './helpers/assert-event-ownership';

export class RemoveEventMediaUseCase {
    constructor(
        private readonly eventRepo: IEventRepository,
        private readonly mediaRepo: IEventMediaRepository,
        private readonly cloudinary: CloudinaryService,
    ) {}

    async execute(
        companyId: string,
        eventId: string,
        mediaId: string,
    ): Promise<void> {
        await assertEventInCompany(this.eventRepo, companyId, eventId);
        const media = await this.mediaRepo.findById(mediaId);
        if (!media) throw new NotFoundDomainException('Media not found');
        if (media.eventId !== eventId) {
            throw new ForbiddenDomainException(
                'Media does not belong to this event',
            );
        }
        if (media.publicId) {
            try {
                await this.cloudinary.deleteImage(media.publicId);
            } catch {
                // non-fatal: log and continue
            }
        }
        await this.mediaRepo.delete(mediaId);
    }
}
