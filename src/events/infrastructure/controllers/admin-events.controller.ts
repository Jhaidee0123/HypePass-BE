import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session } from '../../../auth/decorators';
import { SYSTEM_ROLES, UserSession } from '../../../auth';
import { EventStatus } from '../../domain/types/event-status';
import {
    ApproveEventDto,
    RejectEventDto,
} from '../../application/dto/admin-review-event.dto';
import {
    admin_delete_event_usecase_token,
    admin_list_events_usecase_token,
    approve_event_usecase_token,
    get_event_for_review_usecase_token,
    list_pending_events_usecase_token,
    publish_event_usecase_token,
    reject_event_usecase_token,
    rotate_event_qr_usecase_token,
    unpublish_event_usecase_token,
} from '../tokens/events.tokens';
import { ListPendingEventsUseCase } from '../../application/use-case/admin/list-pending-events.usecase';
import { AdminListEventsUseCase } from '../../application/use-case/admin/list-all-events.usecase';
import { GetEventForReviewUseCase } from '../../application/use-case/admin/get-event-for-review.usecase';
import { ApproveEventUseCase } from '../../application/use-case/admin/approve-event.usecase';
import { RejectEventUseCase } from '../../application/use-case/admin/reject-event.usecase';
import { PublishEventUseCase } from '../../application/use-case/admin/publish-event.usecase';
import { UnpublishEventUseCase } from '../../application/use-case/admin/unpublish-event.usecase';
import { RotateEventQrUseCase } from '../../application/use-case/admin/rotate-event-qr.usecase';
import { AdminDeleteEventUseCase } from '../../application/use-case/admin/admin-delete-event.usecase';

@ApiTags('Admin — Events')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/events')
export class AdminEventsController {
    constructor(
        @Inject(list_pending_events_usecase_token)
        private readonly listPending: ListPendingEventsUseCase,
        @Inject(get_event_for_review_usecase_token)
        private readonly getForReview: GetEventForReviewUseCase,
        @Inject(approve_event_usecase_token)
        private readonly approveEvent: ApproveEventUseCase,
        @Inject(reject_event_usecase_token)
        private readonly rejectEvent: RejectEventUseCase,
        @Inject(publish_event_usecase_token)
        private readonly publishEvent: PublishEventUseCase,
        @Inject(unpublish_event_usecase_token)
        private readonly unpublishEvent: UnpublishEventUseCase,
        @Inject(rotate_event_qr_usecase_token)
        private readonly rotateEventQr: RotateEventQrUseCase,
        @Inject(admin_list_events_usecase_token)
        private readonly listAll: AdminListEventsUseCase,
        @Inject(admin_delete_event_usecase_token)
        private readonly deleteEvent: AdminDeleteEventUseCase,
    ) {}

    @Get()
    list(@Query('status') status?: EventStatus) {
        return this.listPending.execute(status);
    }

    @Get('master')
    listMaster(
        @Query('status') status?: EventStatus,
        @Query('companyId') companyId?: string,
        @Query('search') search?: string,
    ) {
        return this.listAll.execute({ status, companyId, search });
    }

    @Get(':eventId')
    get(@Param('eventId') eventId: string) {
        return this.getForReview.execute(eventId);
    }

    @Patch(':eventId/approve')
    approve(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
        @Body() dto: ApproveEventDto,
    ) {
        return this.approveEvent.execute(session.user.id, eventId, dto);
    }

    @Patch(':eventId/reject')
    reject(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
        @Body() dto: RejectEventDto,
    ) {
        return this.rejectEvent.execute(session.user.id, eventId, dto);
    }

    @Patch(':eventId/publish')
    publish(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
    ) {
        return this.publishEvent.execute(session.user.id, eventId);
    }

    @Patch(':eventId/unpublish')
    unpublish(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
    ) {
        return this.unpublishEvent.execute(session.user.id, eventId);
    }

    @Patch(':eventId/rotate-qr')
    rotateQr(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
    ) {
        return this.rotateEventQr.execute(eventId, session.user.id);
    }

    @Delete(':eventId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Session() session: UserSession,
        @Param('eventId') eventId: string,
    ) {
        await this.deleteEvent.execute(eventId, session.user.id);
    }
}
