import { Controller, Get, Inject } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '../../../auth';
import { list_my_staff_events_usecase_token } from '../tokens/events.tokens';
import { ListMyStaffEventsUseCase } from '../../application/use-case/list-my-staff-events.usecase';

/**
 * Staff self-service: any authenticated user can see the events where they
 * are currently assigned as event-staff. The FE uses this to decide whether
 * to show the "Check-in" link in the nav.
 */
@ApiTags('Staff — Me')
@ApiCookieAuth()
@Controller('me/staff')
export class StaffController {
    constructor(
        @Inject(list_my_staff_events_usecase_token)
        private readonly listMyEvents: ListMyStaffEventsUseCase,
    ) {}

    @Get('events')
    listEvents(@Session() session: UserSession) {
        return this.listMyEvents.execute(session.user.id);
    }
}
