import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '../../../auth/decorators/allow-anonymous.decorator';
import { PublicEventQueryDto } from '../../application/dto/public-event-query.dto';
import { ListPublicEventsUseCase } from '../../application/use-case/public/list-public-events.usecase';
import { GetPublicEventUseCase } from '../../application/use-case/public/get-public-event.usecase';
import {
    get_public_event_usecase_token,
    list_public_events_usecase_token,
} from '../tokens/events.tokens';

@ApiTags('Public — Events')
@AllowAnonymous()
@Controller('public/events')
export class PublicEventsController {
    constructor(
        @Inject(list_public_events_usecase_token)
        private readonly listEvents: ListPublicEventsUseCase,
        @Inject(get_public_event_usecase_token)
        private readonly getEvent: GetPublicEventUseCase,
    ) {}

    @Get()
    list(@Query() query: PublicEventQueryDto) {
        return this.listEvents.execute(query);
    }

    @Get(':slug')
    getBySlug(@Param('slug') slug: string) {
        return this.getEvent.execute(slug);
    }
}
