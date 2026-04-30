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
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { COMPANY_ROLES } from '../../../auth';
import { CompanyRoles } from '../../../auth/decorators/company-roles.decorator';
import { TenantGuard } from '../../../companies/infrastructure/guards/tenant.guard';
import { Session } from '../../../auth/decorators/session.decorator';
import { UserSession } from '../../../auth/types';
import { CreateEventDto } from '../../application/dto/create-event.dto';
import { UpdateEventDto } from '../../application/dto/update-event.dto';
import { CreateEventSessionDto } from '../../application/dto/create-event-session.dto';
import { UpdateEventSessionDto } from '../../application/dto/update-event-session.dto';
import { CreateTicketSectionDto } from '../../application/dto/create-ticket-section.dto';
import { UpdateTicketSectionDto } from '../../application/dto/update-ticket-section.dto';
import { CreateTicketSalePhaseDto } from '../../application/dto/create-ticket-sale-phase.dto';
import { UpdateTicketSalePhaseDto } from '../../application/dto/update-ticket-sale-phase.dto';
import { AddEventMediaDto } from '../../application/dto/add-event-media.dto';
import { SubmitForReviewDto } from '../../application/dto/submit-for-review.dto';
import {
    add_event_media_usecase_token,
    create_event_usecase_token,
    create_phase_usecase_token,
    create_section_usecase_token,
    create_session_usecase_token,
    delete_event_usecase_token,
    delete_phase_usecase_token,
    delete_section_usecase_token,
    delete_session_usecase_token,
    get_event_sales_summary_usecase_token,
    get_event_usecase_token,
    issue_courtesies_usecase_token,
    assign_event_staff_usecase_token,
    list_event_staff_usecase_token,
    revoke_event_staff_usecase_token,
    assign_event_promoters_usecase_token,
    list_event_promoters_usecase_token,
    revoke_event_promoter_usecase_token,
    list_event_attendees_usecase_token,
    list_events_by_company_usecase_token,
    remove_event_media_usecase_token,
    submit_event_for_review_usecase_token,
    update_event_usecase_token,
    update_phase_usecase_token,
    update_section_usecase_token,
    update_session_usecase_token,
} from '../tokens/events.tokens';
import { CreateEventUseCase } from '../../application/use-case/create-event.usecase';
import { ListEventsByCompanyUseCase } from '../../application/use-case/list-events-by-company.usecase';
import { GetEventUseCase } from '../../application/use-case/get-event.usecase';
import { UpdateEventUseCase } from '../../application/use-case/update-event.usecase';
import { DeleteEventUseCase } from '../../application/use-case/delete-event.usecase';
import { SubmitEventForReviewUseCase } from '../../application/use-case/submit-event-for-review.usecase';
import { CreateSessionUseCase } from '../../application/use-case/create-session.usecase';
import { UpdateSessionUseCase } from '../../application/use-case/update-session.usecase';
import { DeleteSessionUseCase } from '../../application/use-case/delete-session.usecase';
import { CreateSectionUseCase } from '../../application/use-case/create-section.usecase';
import { UpdateSectionUseCase } from '../../application/use-case/update-section.usecase';
import { DeleteSectionUseCase } from '../../application/use-case/delete-section.usecase';
import { CreatePhaseUseCase } from '../../application/use-case/create-phase.usecase';
import { UpdatePhaseUseCase } from '../../application/use-case/update-phase.usecase';
import { DeletePhaseUseCase } from '../../application/use-case/delete-phase.usecase';
import { AddEventMediaUseCase } from '../../application/use-case/add-event-media.usecase';
import { RemoveEventMediaUseCase } from '../../application/use-case/remove-event-media.usecase';
import { GetEventSalesSummaryUseCase } from '../../application/use-case/get-event-sales-summary.usecase';
import { IssueCourtesiesUseCase } from '../../application/use-case/issue-courtesies.usecase';
import { IssueCourtesiesDto } from '../../application/dto/issue-courtesies.dto';
import { AssignEventStaffUseCase } from '../../application/use-case/assign-event-staff.usecase';
import { ListEventStaffUseCase } from '../../application/use-case/list-event-staff.usecase';
import { RevokeEventStaffUseCase } from '../../application/use-case/revoke-event-staff.usecase';
import { AssignEventStaffDto } from '../../application/dto/assign-event-staff.dto';
import { AssignEventPromotersUseCase } from '../../application/use-case/assign-event-promoters.usecase';
import { ListEventPromotersUseCase } from '../../application/use-case/list-event-promoters.usecase';
import { RevokeEventPromoterUseCase } from '../../application/use-case/revoke-event-promoter.usecase';
import { AssignEventPromotersDto } from '../../application/dto/assign-event-promoters.dto';
import { ListEventAttendeesUseCase } from '../../application/use-case/list-event-attendees.usecase';

@ApiTags('Organizer — Events')
@ApiCookieAuth()
@UseGuards(TenantGuard)
@CompanyRoles([COMPANY_ROLES.OWNER, COMPANY_ROLES.ADMIN])
@Controller('companies/:companyId/events')
export class OrganizerEventsController {
    constructor(
        @Inject(create_event_usecase_token)
        private readonly createEvent: CreateEventUseCase,
        @Inject(list_events_by_company_usecase_token)
        private readonly listEvents: ListEventsByCompanyUseCase,
        @Inject(get_event_usecase_token)
        private readonly getEvent: GetEventUseCase,
        @Inject(update_event_usecase_token)
        private readonly updateEvent: UpdateEventUseCase,
        @Inject(delete_event_usecase_token)
        private readonly deleteEvent: DeleteEventUseCase,
        @Inject(submit_event_for_review_usecase_token)
        private readonly submitForReview: SubmitEventForReviewUseCase,
        @Inject(create_session_usecase_token)
        private readonly createSession: CreateSessionUseCase,
        @Inject(update_session_usecase_token)
        private readonly updateSession: UpdateSessionUseCase,
        @Inject(delete_session_usecase_token)
        private readonly deleteSession: DeleteSessionUseCase,
        @Inject(create_section_usecase_token)
        private readonly createSection: CreateSectionUseCase,
        @Inject(update_section_usecase_token)
        private readonly updateSection: UpdateSectionUseCase,
        @Inject(delete_section_usecase_token)
        private readonly deleteSection: DeleteSectionUseCase,
        @Inject(create_phase_usecase_token)
        private readonly createPhase: CreatePhaseUseCase,
        @Inject(update_phase_usecase_token)
        private readonly updatePhase: UpdatePhaseUseCase,
        @Inject(delete_phase_usecase_token)
        private readonly deletePhase: DeletePhaseUseCase,
        @Inject(add_event_media_usecase_token)
        private readonly addMedia: AddEventMediaUseCase,
        @Inject(remove_event_media_usecase_token)
        private readonly removeMedia: RemoveEventMediaUseCase,
        @Inject(get_event_sales_summary_usecase_token)
        private readonly getSalesSummary: GetEventSalesSummaryUseCase,
        @Inject(issue_courtesies_usecase_token)
        private readonly issueCourtesies: IssueCourtesiesUseCase,
        @Inject(assign_event_staff_usecase_token)
        private readonly assignStaff: AssignEventStaffUseCase,
        @Inject(list_event_staff_usecase_token)
        private readonly listStaff: ListEventStaffUseCase,
        @Inject(revoke_event_staff_usecase_token)
        private readonly revokeStaff: RevokeEventStaffUseCase,
        @Inject(assign_event_promoters_usecase_token)
        private readonly assignPromoters: AssignEventPromotersUseCase,
        @Inject(list_event_promoters_usecase_token)
        private readonly listPromoters: ListEventPromotersUseCase,
        @Inject(revoke_event_promoter_usecase_token)
        private readonly revokePromoter: RevokeEventPromoterUseCase,
        @Inject(list_event_attendees_usecase_token)
        private readonly listAttendees: ListEventAttendeesUseCase,
    ) {}

    // ===== events =====

    @Get()
    @CompanyRoles([
        COMPANY_ROLES.OWNER,
        COMPANY_ROLES.ADMIN,
        COMPANY_ROLES.VIEWER,
    ])
    list(@Param('companyId') companyId: string) {
        return this.listEvents.execute(companyId);
    }

    @Post()
    create(
        @Param('companyId') companyId: string,
        @Body() dto: CreateEventDto,
    ) {
        return this.createEvent.execute(companyId, dto);
    }

    @Get(':eventId')
    @CompanyRoles([
        COMPANY_ROLES.OWNER,
        COMPANY_ROLES.ADMIN,
        COMPANY_ROLES.VIEWER,
    ])
    get(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
    ) {
        return this.getEvent.execute(companyId, eventId);
    }

    @Patch(':eventId')
    update(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: UpdateEventDto,
    ) {
        return this.updateEvent.execute(companyId, eventId, dto);
    }

    @Delete(':eventId')
    @CompanyRoles([COMPANY_ROLES.OWNER])
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Session() session: UserSession,
    ) {
        await this.deleteEvent.execute(companyId, eventId, session.user.id);
    }

    @Get(':eventId/sales-summary')
    @CompanyRoles([
        COMPANY_ROLES.OWNER,
        COMPANY_ROLES.ADMIN,
        COMPANY_ROLES.VIEWER,
    ])
    salesSummary(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
    ) {
        return this.getSalesSummary.execute(companyId, eventId);
    }

    @Post(':eventId/courtesies')
    @HttpCode(HttpStatus.CREATED)
    issueCourtesyBatch(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: IssueCourtesiesDto,
        @Session() session: UserSession,
    ) {
        return this.issueCourtesies.execute(
            companyId,
            eventId,
            session.user.id,
            dto,
        );
    }

    // ===== staff =====

    @Get(':eventId/staff')
    getStaff(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
    ) {
        return this.listStaff.execute(companyId, eventId);
    }

    @Post(':eventId/staff')
    @HttpCode(HttpStatus.CREATED)
    assignStaffBatch(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: AssignEventStaffDto,
        @Session() session: UserSession,
    ) {
        return this.assignStaff.execute(
            companyId,
            eventId,
            session.user.id,
            dto,
        );
    }

    @Delete(':eventId/staff/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async revokeStaffMember(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('userId') userId: string,
        @Session() session: UserSession,
    ) {
        await this.revokeStaff.execute(
            companyId,
            eventId,
            userId,
            session.user.id,
        );
    }

    // ===== promoters =====

    @Get(':eventId/promoters')
    getPromoters(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
    ) {
        return this.listPromoters.execute(companyId, eventId);
    }

    @Post(':eventId/promoters')
    @HttpCode(HttpStatus.CREATED)
    assignPromotersBatch(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: AssignEventPromotersDto,
        @Session() session: UserSession,
    ) {
        return this.assignPromoters.execute(
            companyId,
            eventId,
            session.user.id,
            dto,
        );
    }

    @Delete(':eventId/promoters/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async revokePromoterAssignment(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('userId') userId: string,
        @Session() session: UserSession,
    ) {
        await this.revokePromoter.execute(
            companyId,
            eventId,
            userId,
            session.user.id,
        );
    }

    // ===== attendees (paid + courtesy ticket holders) =====

    @Get(':eventId/attendees')
    @CompanyRoles([
        COMPANY_ROLES.OWNER,
        COMPANY_ROLES.ADMIN,
        COMPANY_ROLES.VIEWER,
    ])
    getAttendees(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Query('sessionId') sessionId?: string,
        @Query('sectionId') sectionId?: string,
        @Query('type') type?: 'paid' | 'courtesy',
        @Query('q') q?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.listAttendees.execute(companyId, eventId, {
            sessionId,
            sectionId,
            type,
            q,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Post(':eventId/submit-review')
    submit(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: SubmitForReviewDto,
        @Session() session: UserSession,
    ) {
        return this.submitForReview.execute(
            companyId,
            eventId,
            session.user.id,
            dto,
        );
    }

    // ===== sessions =====

    @Post(':eventId/sessions')
    addSession(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: CreateEventSessionDto,
    ) {
        return this.createSession.execute(companyId, eventId, dto);
    }

    @Patch(':eventId/sessions/:sessionId')
    editSession(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Body() dto: UpdateEventSessionDto,
    ) {
        return this.updateSession.execute(
            companyId,
            eventId,
            sessionId,
            dto,
        );
    }

    @Delete(':eventId/sessions/:sessionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeSession(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
    ) {
        await this.deleteSession.execute(companyId, eventId, sessionId);
    }

    // ===== sections =====

    @Post(':eventId/sessions/:sessionId/sections')
    addSection(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Body() dto: CreateTicketSectionDto,
    ) {
        return this.createSection.execute(
            companyId,
            eventId,
            sessionId,
            dto,
        );
    }

    @Patch(':eventId/sessions/:sessionId/sections/:sectionId')
    editSection(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Param('sectionId') sectionId: string,
        @Body() dto: UpdateTicketSectionDto,
    ) {
        return this.updateSection.execute(
            companyId,
            eventId,
            sessionId,
            sectionId,
            dto,
        );
    }

    @Delete(':eventId/sessions/:sessionId/sections/:sectionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeSection(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Param('sectionId') sectionId: string,
    ) {
        await this.deleteSection.execute(
            companyId,
            eventId,
            sessionId,
            sectionId,
        );
    }

    // ===== phases =====

    @Post(':eventId/sessions/:sessionId/sections/:sectionId/phases')
    addPhase(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Param('sectionId') sectionId: string,
        @Body() dto: CreateTicketSalePhaseDto,
    ) {
        return this.createPhase.execute(
            companyId,
            eventId,
            sessionId,
            sectionId,
            dto,
        );
    }

    @Patch(':eventId/sessions/:sessionId/sections/:sectionId/phases/:phaseId')
    editPhase(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Param('sectionId') sectionId: string,
        @Param('phaseId') phaseId: string,
        @Body() dto: UpdateTicketSalePhaseDto,
    ) {
        return this.updatePhase.execute(
            companyId,
            eventId,
            sessionId,
            sectionId,
            phaseId,
            dto,
        );
    }

    @Delete(':eventId/sessions/:sessionId/sections/:sectionId/phases/:phaseId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removePhase(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('sessionId') sessionId: string,
        @Param('sectionId') sectionId: string,
        @Param('phaseId') phaseId: string,
    ) {
        await this.deletePhase.execute(
            companyId,
            eventId,
            sessionId,
            sectionId,
            phaseId,
        );
    }

    // ===== media =====

    @Post(':eventId/media')
    postMedia(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Body() dto: AddEventMediaDto,
    ) {
        return this.addMedia.execute(companyId, eventId, dto);
    }

    @Delete(':eventId/media/:mediaId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMedia(
        @Param('companyId') companyId: string,
        @Param('eventId') eventId: string,
        @Param('mediaId') mediaId: string,
    ) {
        await this.removeMedia.execute(companyId, eventId, mediaId);
    }
}
