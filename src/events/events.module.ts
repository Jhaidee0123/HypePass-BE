import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { VenuesModule } from '../venues/venues.module';
import { CategoriesModule } from '../categories/categories.module';
import { TicketsModule } from '../tickets/tickets.module';
import {
    inventory_hold_service_token,
    ticket_service_token,
} from '../tickets/infrastructure/tokens/tickets.tokens';
import { TicketService } from '../tickets/application/services/ticket.service';
import { InventoryHoldService } from '../tickets/application/services/inventory-hold.service';
import { UserService } from '../users/application/services/user.service';
import { BETTER_AUTH } from '../auth/constants';
import { CloudinaryService } from '../shared/infrastructure/services/cloudinary.service';
import { EmailService } from '../shared/infrastructure/services/email.service';
import { AuditLogService } from '../audit/application/services/audit-log.service';
import { user_service_token } from '../users/infrastructure/tokens/users.tokens';
import {
    company_membership_service_token,
    company_service_token,
} from '../companies/infrastructure/tokens/companies.tokens';
import { venue_service_token } from '../venues/infrastructure/tokens/venues.tokens';
import { category_service_token } from '../categories/infrastructure/tokens/categories.tokens';
import { EventOrmEntity } from './infrastructure/orm/event.orm.entity';
import { EventSessionOrmEntity } from './infrastructure/orm/event-session.orm.entity';
import { TicketSectionOrmEntity } from './infrastructure/orm/ticket-section.orm.entity';
import { TicketSalePhaseOrmEntity } from './infrastructure/orm/ticket-sale-phase.orm.entity';
import { EventMediaOrmEntity } from './infrastructure/orm/event-media.orm.entity';
import { EventPublicationReviewOrmEntity } from './infrastructure/orm/event-publication-review.orm.entity';
import { EventStaffOrmEntity } from './infrastructure/orm/event-staff.orm.entity';
import { EventService } from './application/services/event.service';
import { EventSessionService } from './application/services/event-session.service';
import { TicketSectionService } from './application/services/ticket-section.service';
import { TicketSalePhaseService } from './application/services/ticket-sale-phase.service';
import { EventMediaService } from './application/services/event-media.service';
import { EventPublicationReviewService } from './application/services/event-publication-review.service';
import { EventStaffService } from './application/services/event-staff.service';
import { OrganizerEventsController } from './infrastructure/controllers/organizer-events.controller';
import { AdminEventsController } from './infrastructure/controllers/admin-events.controller';
import { PublicEventsController } from './infrastructure/controllers/public-events.controller';
import {
    add_event_media_usecase_token,
    approve_event_usecase_token,
    create_event_usecase_token,
    get_event_sales_summary_usecase_token,
    issue_courtesies_usecase_token,
    assign_event_staff_usecase_token,
    list_event_staff_usecase_token,
    revoke_event_staff_usecase_token,
    create_phase_usecase_token,
    create_section_usecase_token,
    create_session_usecase_token,
    delete_event_usecase_token,
    delete_phase_usecase_token,
    delete_section_usecase_token,
    delete_session_usecase_token,
    event_media_service_token,
    event_publication_review_service_token,
    event_staff_service_token,
    event_service_token,
    event_session_service_token,
    get_event_for_review_usecase_token,
    get_event_usecase_token,
    list_events_by_company_usecase_token,
    admin_list_events_usecase_token,
    admin_delete_event_usecase_token,
    list_pending_events_usecase_token,
    publish_event_usecase_token,
    reject_event_usecase_token,
    rotate_event_qr_usecase_token,
    remove_event_media_usecase_token,
    submit_event_for_review_usecase_token,
    ticket_sale_phase_service_token,
    ticket_section_service_token,
    unpublish_event_usecase_token,
    update_event_usecase_token,
    update_phase_usecase_token,
    update_section_usecase_token,
    update_session_usecase_token,
    list_public_events_usecase_token,
    get_public_event_usecase_token,
    event_promoter_service_token,
    assign_event_promoters_usecase_token,
    list_event_promoters_usecase_token,
    revoke_event_promoter_usecase_token,
    list_my_promoted_events_usecase_token,
    get_promoter_sales_usecase_token,
    list_event_attendees_usecase_token,
    list_my_staff_events_usecase_token,
} from './infrastructure/tokens/events.tokens';
import { CreateEventUseCase } from './application/use-case/create-event.usecase';
import { ListEventsByCompanyUseCase } from './application/use-case/list-events-by-company.usecase';
import { GetEventUseCase } from './application/use-case/get-event.usecase';
import { UpdateEventUseCase } from './application/use-case/update-event.usecase';
import { DeleteEventUseCase } from './application/use-case/delete-event.usecase';
import { SubmitEventForReviewUseCase } from './application/use-case/submit-event-for-review.usecase';
import { AdminNotificationService } from '../admin-notifications/application/services/admin-notification.service';
import { GetEventSalesSummaryUseCase } from './application/use-case/get-event-sales-summary.usecase';
import { IssueCourtesiesUseCase } from './application/use-case/issue-courtesies.usecase';
import { AssignEventStaffUseCase } from './application/use-case/assign-event-staff.usecase';
import { ListEventStaffUseCase } from './application/use-case/list-event-staff.usecase';
import { RevokeEventStaffUseCase } from './application/use-case/revoke-event-staff.usecase';
import { CreateSessionUseCase } from './application/use-case/create-session.usecase';
import { UpdateSessionUseCase } from './application/use-case/update-session.usecase';
import { DeleteSessionUseCase } from './application/use-case/delete-session.usecase';
import { CreateSectionUseCase } from './application/use-case/create-section.usecase';
import { UpdateSectionUseCase } from './application/use-case/update-section.usecase';
import { DeleteSectionUseCase } from './application/use-case/delete-section.usecase';
import { CreatePhaseUseCase } from './application/use-case/create-phase.usecase';
import { UpdatePhaseUseCase } from './application/use-case/update-phase.usecase';
import { DeletePhaseUseCase } from './application/use-case/delete-phase.usecase';
import { AddEventMediaUseCase } from './application/use-case/add-event-media.usecase';
import { RemoveEventMediaUseCase } from './application/use-case/remove-event-media.usecase';
import { ListPendingEventsUseCase } from './application/use-case/admin/list-pending-events.usecase';
import { AdminListEventsUseCase } from './application/use-case/admin/list-all-events.usecase';
import { GetEventForReviewUseCase } from './application/use-case/admin/get-event-for-review.usecase';
import { ApproveEventUseCase } from './application/use-case/admin/approve-event.usecase';
import { RejectEventUseCase } from './application/use-case/admin/reject-event.usecase';
import { PublishEventUseCase } from './application/use-case/admin/publish-event.usecase';
import { UnpublishEventUseCase } from './application/use-case/admin/unpublish-event.usecase';
import { RotateEventQrUseCase } from './application/use-case/admin/rotate-event-qr.usecase';
import { AdminDeleteEventUseCase } from './application/use-case/admin/admin-delete-event.usecase';
import { ListPublicEventsUseCase } from './application/use-case/public/list-public-events.usecase';
import { GetPublicEventUseCase } from './application/use-case/public/get-public-event.usecase';
import { EventPromoterOrmEntity } from './infrastructure/orm/event-promoter.orm.entity';
import { EventPromoterService } from './application/services/event-promoter.service';
import { AssignEventPromotersUseCase } from './application/use-case/assign-event-promoters.usecase';
import { ListEventPromotersUseCase } from './application/use-case/list-event-promoters.usecase';
import { RevokeEventPromoterUseCase } from './application/use-case/revoke-event-promoter.usecase';
import { ListMyPromotedEventsUseCase } from './application/use-case/list-my-promoted-events.usecase';
import { GetPromoterSalesUseCase } from './application/use-case/get-promoter-sales.usecase';
import { ListEventAttendeesUseCase } from './application/use-case/list-event-attendees.usecase';
import { ListMyStaffEventsUseCase } from './application/use-case/list-my-staff-events.usecase';
import { PromoterController } from './infrastructure/controllers/promoter.controller';
import { StaffController } from './infrastructure/controllers/staff.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            EventOrmEntity,
            EventSessionOrmEntity,
            TicketSectionOrmEntity,
            TicketSalePhaseOrmEntity,
            EventMediaOrmEntity,
            EventPublicationReviewOrmEntity,
            EventStaffOrmEntity,
            EventPromoterOrmEntity,
        ]),
        forwardRef(() => CompaniesModule),
        UsersModule,
        VenuesModule,
        CategoriesModule,
        TicketsModule,
    ],
    providers: [
        // services
        { provide: event_service_token, useClass: EventService },
        {
            provide: event_session_service_token,
            useClass: EventSessionService,
        },
        {
            provide: ticket_section_service_token,
            useClass: TicketSectionService,
        },
        {
            provide: ticket_sale_phase_service_token,
            useClass: TicketSalePhaseService,
        },
        { provide: event_media_service_token, useClass: EventMediaService },
        {
            provide: event_publication_review_service_token,
            useClass: EventPublicationReviewService,
        },
        { provide: event_staff_service_token, useClass: EventStaffService },

        // event use cases
        {
            provide: create_event_usecase_token,
            useFactory: (s: EventService) => new CreateEventUseCase(s),
            inject: [event_service_token],
        },
        {
            provide: list_events_by_company_usecase_token,
            useFactory: (s: EventService) =>
                new ListEventsByCompanyUseCase(s),
            inject: [event_service_token],
        },
        {
            provide: get_event_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
                me: EventMediaService,
            ) => new GetEventUseCase(ev, ses, sec, ph, me),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
                event_media_service_token,
            ],
        },
        {
            provide: update_event_usecase_token,
            useFactory: (s: EventService) => new UpdateEventUseCase(s),
            inject: [event_service_token],
        },
        {
            provide: delete_event_usecase_token,
            useFactory: (
                s: EventService,
                tickets: TicketService,
                audit: AuditLogService,
            ) => new DeleteEventUseCase(s, tickets, audit),
            inject: [event_service_token, ticket_service_token, AuditLogService],
        },
        {
            provide: get_event_sales_summary_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                tickets: TicketService,
                holds: InventoryHoldService,
            ) =>
                new GetEventSalesSummaryUseCase(
                    ev,
                    ses,
                    sec,
                    tickets,
                    holds,
                ),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_service_token,
                inventory_hold_service_token,
            ],
        },
        {
            provide: issue_courtesies_usecase_token,
            useFactory: (
                ds: DataSource,
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                users: UserService,
                email: EmailService,
                audit: AuditLogService,
                auth: any,
            ) =>
                new IssueCourtesiesUseCase(
                    ds,
                    ev,
                    ses,
                    sec,
                    users,
                    email,
                    audit,
                    auth,
                ),
            inject: [
                DataSource,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
                BETTER_AUTH,
            ],
        },
        {
            provide: assign_event_staff_usecase_token,
            useFactory: (
                ev: EventService,
                staff: EventStaffService,
                users: UserService,
                email: EmailService,
                audit: AuditLogService,
                auth: any,
            ) =>
                new AssignEventStaffUseCase(
                    ev,
                    staff,
                    users,
                    email,
                    audit,
                    auth,
                ),
            inject: [
                event_service_token,
                event_staff_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
                BETTER_AUTH,
            ],
        },
        {
            provide: list_event_staff_usecase_token,
            useFactory: (
                ev: EventService,
                staff: EventStaffService,
                users: UserService,
            ) => new ListEventStaffUseCase(ev, staff, users),
            inject: [
                event_service_token,
                event_staff_service_token,
                user_service_token,
            ],
        },
        {
            provide: revoke_event_staff_usecase_token,
            useFactory: (
                ev: EventService,
                staff: EventStaffService,
                audit: AuditLogService,
            ) => new RevokeEventStaffUseCase(ev, staff, audit),
            inject: [
                event_service_token,
                event_staff_service_token,
                AuditLogService,
            ],
        },
        // promoter
        { provide: event_promoter_service_token, useClass: EventPromoterService },
        {
            provide: assign_event_promoters_usecase_token,
            useFactory: (
                ev: EventService,
                promoter: EventPromoterService,
                users: UserService,
                email: EmailService,
                audit: AuditLogService,
                auth: any,
            ) =>
                new AssignEventPromotersUseCase(
                    ev,
                    promoter,
                    users,
                    email,
                    audit,
                    auth,
                ),
            inject: [
                event_service_token,
                event_promoter_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
                BETTER_AUTH,
            ],
        },
        {
            provide: list_event_promoters_usecase_token,
            useFactory: (
                ev: EventService,
                promoter: EventPromoterService,
                users: UserService,
                ds: DataSource,
            ) => new ListEventPromotersUseCase(ev, promoter, users, ds),
            inject: [
                event_service_token,
                event_promoter_service_token,
                user_service_token,
                DataSource,
            ],
        },
        {
            provide: revoke_event_promoter_usecase_token,
            useFactory: (
                ev: EventService,
                promoter: EventPromoterService,
                audit: AuditLogService,
            ) => new RevokeEventPromoterUseCase(ev, promoter, audit),
            inject: [
                event_service_token,
                event_promoter_service_token,
                AuditLogService,
            ],
        },
        {
            provide: list_my_promoted_events_usecase_token,
            useFactory: (
                ev: EventService,
                promoter: EventPromoterService,
                ds: DataSource,
            ) => new ListMyPromotedEventsUseCase(ev, promoter, ds),
            inject: [
                event_service_token,
                event_promoter_service_token,
                DataSource,
            ],
        },
        {
            provide: get_promoter_sales_usecase_token,
            useFactory: (
                ev: EventService,
                promoter: EventPromoterService,
                ds: DataSource,
            ) => new GetPromoterSalesUseCase(ev, promoter, ds),
            inject: [
                event_service_token,
                event_promoter_service_token,
                DataSource,
            ],
        },
        {
            provide: list_event_attendees_usecase_token,
            useFactory: (ev: EventService, ds: DataSource) =>
                new ListEventAttendeesUseCase(ev, ds),
            inject: [event_service_token, DataSource],
        },
        {
            provide: list_my_staff_events_usecase_token,
            useFactory: (ev: EventService, staff: EventStaffService) =>
                new ListMyStaffEventsUseCase(ev, staff),
            inject: [event_service_token, event_staff_service_token],
        },
        {
            provide: submit_event_for_review_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
                rev: EventPublicationReviewService,
                email: EmailService,
                adminNotifications: AdminNotificationService,
            ) =>
                new SubmitEventForReviewUseCase(
                    ev,
                    ses,
                    sec,
                    ph,
                    rev,
                    email,
                    adminNotifications,
                ),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
                event_publication_review_service_token,
                EmailService,
                AdminNotificationService,
            ],
        },

        // session use cases
        {
            provide: create_session_usecase_token,
            useFactory: (ev: EventService, ses: EventSessionService) =>
                new CreateSessionUseCase(ev, ses),
            inject: [event_service_token, event_session_service_token],
        },
        {
            provide: update_session_usecase_token,
            useFactory: (ev: EventService, ses: EventSessionService) =>
                new UpdateSessionUseCase(ev, ses),
            inject: [event_service_token, event_session_service_token],
        },
        {
            provide: delete_session_usecase_token,
            useFactory: (ev: EventService, ses: EventSessionService) =>
                new DeleteSessionUseCase(ev, ses),
            inject: [event_service_token, event_session_service_token],
        },

        // section use cases
        {
            provide: create_section_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
            ) => new CreateSectionUseCase(ev, ses, sec),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
            ],
        },
        {
            provide: update_section_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
            ) => new UpdateSectionUseCase(ev, ses, sec),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
            ],
        },
        {
            provide: delete_section_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
            ) => new DeleteSectionUseCase(ev, ses, sec),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
            ],
        },

        // phase use cases
        {
            provide: create_phase_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
            ) => new CreatePhaseUseCase(ev, ses, sec, ph),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
            ],
        },
        {
            provide: update_phase_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
            ) => new UpdatePhaseUseCase(ev, ses, sec, ph),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
            ],
        },
        {
            provide: delete_phase_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
            ) => new DeletePhaseUseCase(ev, ses, sec, ph),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
            ],
        },

        // media use cases
        {
            provide: add_event_media_usecase_token,
            useFactory: (ev: EventService, me: EventMediaService) =>
                new AddEventMediaUseCase(ev, me),
            inject: [event_service_token, event_media_service_token],
        },
        {
            provide: remove_event_media_usecase_token,
            useFactory: (
                ev: EventService,
                me: EventMediaService,
                cl: CloudinaryService,
            ) => new RemoveEventMediaUseCase(ev, me, cl),
            inject: [
                event_service_token,
                event_media_service_token,
                CloudinaryService,
            ],
        },

        // admin use cases
        {
            provide: list_pending_events_usecase_token,
            useFactory: (ev: EventService) =>
                new ListPendingEventsUseCase(ev),
            inject: [event_service_token],
        },
        {
            provide: admin_list_events_usecase_token,
            useFactory: (ev: EventService) => new AdminListEventsUseCase(ev),
            inject: [event_service_token],
        },
        {
            provide: get_event_for_review_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
                me: EventMediaService,
                rev: EventPublicationReviewService,
            ) =>
                new GetEventForReviewUseCase(
                    ev,
                    ses,
                    sec,
                    ph,
                    me,
                    rev,
                ),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
                event_media_service_token,
                event_publication_review_service_token,
            ],
        },
        {
            provide: approve_event_usecase_token,
            useFactory: (
                ev: EventService,
                rev: EventPublicationReviewService,
                comp,
                memb,
                user,
                email: EmailService,
                audit: AuditLogService,
            ) =>
                new ApproveEventUseCase(
                    ev,
                    rev,
                    comp,
                    memb,
                    user,
                    email,
                    audit,
                ),
            inject: [
                event_service_token,
                event_publication_review_service_token,
                company_service_token,
                company_membership_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
            ],
        },
        {
            provide: reject_event_usecase_token,
            useFactory: (
                ev: EventService,
                rev: EventPublicationReviewService,
                memb,
                user,
                email: EmailService,
                audit: AuditLogService,
            ) =>
                new RejectEventUseCase(ev, rev, memb, user, email, audit),
            inject: [
                event_service_token,
                event_publication_review_service_token,
                company_membership_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
            ],
        },
        {
            provide: publish_event_usecase_token,
            useFactory: (ev: EventService, audit: AuditLogService) =>
                new PublishEventUseCase(ev, audit),
            inject: [event_service_token, AuditLogService],
        },
        {
            provide: unpublish_event_usecase_token,
            useFactory: (ev: EventService, audit: AuditLogService) =>
                new UnpublishEventUseCase(ev, audit),
            inject: [event_service_token, AuditLogService],
        },
        {
            provide: rotate_event_qr_usecase_token,
            useFactory: (
                ds: DataSource,
                ev: EventService,
                audit: AuditLogService,
            ) => new RotateEventQrUseCase(ds, ev, audit),
            inject: [DataSource, event_service_token, AuditLogService],
        },
        {
            provide: admin_delete_event_usecase_token,
            useFactory: (
                ev: EventService,
                tickets: TicketService,
                audit: AuditLogService,
            ) => new AdminDeleteEventUseCase(ev, tickets, audit),
            inject: [event_service_token, ticket_service_token, AuditLogService],
        },

        // public (discovery) use cases
        {
            provide: list_public_events_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
                cat,
                venue,
            ) =>
                new ListPublicEventsUseCase(ev, ses, sec, ph, cat, venue),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
                category_service_token,
                venue_service_token,
            ],
        },
        {
            provide: get_public_event_usecase_token,
            useFactory: (
                ev: EventService,
                ses: EventSessionService,
                sec: TicketSectionService,
                ph: TicketSalePhaseService,
                cat,
                venue,
            ) => new GetPublicEventUseCase(ev, ses, sec, ph, cat, venue),
            inject: [
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
                category_service_token,
                venue_service_token,
            ],
        },
    ],
    controllers: [
        OrganizerEventsController,
        AdminEventsController,
        PublicEventsController,
        PromoterController,
        StaffController,
    ],
    exports: [
        event_service_token,
        event_session_service_token,
        ticket_section_service_token,
        ticket_sale_phase_service_token,
        event_media_service_token,
        event_publication_review_service_token,
        event_staff_service_token,
        event_promoter_service_token,
    ],
})
export class EventsModule {}
