import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../shared/infrastructure/services/email.service';
import { AuditLogService } from '../audit/application/services/audit-log.service';
import { user_service_token } from '../users/infrastructure/tokens/users.tokens';
import { EventsModule } from '../events/events.module';
import { TicketsModule } from '../tickets/tickets.module';
import { event_service_token } from '../events/infrastructure/tokens/events.tokens';
import { ticket_service_token } from '../tickets/infrastructure/tokens/tickets.tokens';
import { EventService } from '../events/application/services/event.service';
import { TicketService } from '../tickets/application/services/ticket.service';
import { CompanyOrmEntity } from './infrastructure/orm/company.orm.entity';
import { CompanyMembershipOrmEntity } from './infrastructure/orm/company-membership.orm.entity';
import { CompanyService } from './application/services/company.service';
import { CompanyMembershipService } from './application/services/company-membership.service';
import { CompaniesController } from './infrastructure/controllers/companies.controller';
import { AdminCompaniesController } from './infrastructure/controllers/admin-companies.controller';
import { TenantGuard } from './infrastructure/guards/tenant.guard';
import {
    add_member_usecase_token,
    approve_company_usecase_token,
    company_membership_service_token,
    company_service_token,
    create_company_usecase_token,
    delete_company_usecase_token,
    list_companies_usecase_token,
    list_members_usecase_token,
    list_my_companies_usecase_token,
    reinstate_company_usecase_token,
    reject_company_usecase_token,
    remove_member_usecase_token,
    suspend_company_usecase_token,
} from './infrastructure/tokens/companies.tokens';
import { CreateCompanyUseCase } from './application/use-case/create-company.usecase';
import { ListCompaniesUseCase } from './application/use-case/list-companies.usecase';
import { ListMyCompaniesUseCase } from './application/use-case/list-my-companies.usecase';
import { ApproveCompanyUseCase } from './application/use-case/approve-company.usecase';
import { RejectCompanyUseCase } from './application/use-case/reject-company.usecase';
import { AddMemberUseCase } from './application/use-case/add-member.usecase';
import { ListMembersUseCase } from './application/use-case/list-members.usecase';
import { RemoveMemberUseCase } from './application/use-case/remove-member.usecase';
import {
    ReinstateCompanyUseCase,
    SuspendCompanyUseCase,
} from './application/use-case/suspend-company.usecase';
import { DeleteCompanyUseCase } from './application/use-case/delete-company.usecase';
import { AdminNotificationService } from '../admin-notifications/application/services/admin-notification.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CompanyOrmEntity,
            CompanyMembershipOrmEntity,
        ]),
        UsersModule,
        forwardRef(() => EventsModule),
        TicketsModule,
    ],
    providers: [
        { provide: company_service_token, useClass: CompanyService },
        {
            provide: company_membership_service_token,
            useClass: CompanyMembershipService,
        },
        {
            provide: create_company_usecase_token,
            useFactory: (
                companyService: CompanyService,
                membershipService: CompanyMembershipService,
                adminNotifications: AdminNotificationService,
            ) =>
                new CreateCompanyUseCase(
                    companyService,
                    membershipService,
                    adminNotifications,
                ),
            inject: [
                company_service_token,
                company_membership_service_token,
                AdminNotificationService,
            ],
        },
        {
            provide: list_companies_usecase_token,
            useFactory: (s: CompanyService) => new ListCompaniesUseCase(s),
            inject: [company_service_token],
        },
        {
            provide: list_my_companies_usecase_token,
            useFactory: (
                companyService: CompanyService,
                membershipService: CompanyMembershipService,
            ) =>
                new ListMyCompaniesUseCase(companyService, membershipService),
            inject: [company_service_token, company_membership_service_token],
        },
        {
            provide: approve_company_usecase_token,
            useFactory: (
                company: CompanyService,
                membership: CompanyMembershipService,
                user,
                email: EmailService,
                audit: AuditLogService,
            ) =>
                new ApproveCompanyUseCase(
                    company,
                    membership,
                    user,
                    email,
                    audit,
                ),
            inject: [
                company_service_token,
                company_membership_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
            ],
        },
        {
            provide: reject_company_usecase_token,
            useFactory: (
                company: CompanyService,
                membership: CompanyMembershipService,
                user,
                email: EmailService,
                audit: AuditLogService,
            ) =>
                new RejectCompanyUseCase(
                    company,
                    membership,
                    user,
                    email,
                    audit,
                ),
            inject: [
                company_service_token,
                company_membership_service_token,
                user_service_token,
                EmailService,
                AuditLogService,
            ],
        },
        {
            provide: add_member_usecase_token,
            useFactory: (
                companyService: CompanyService,
                membershipService: CompanyMembershipService,
                userService,
            ) =>
                new AddMemberUseCase(
                    companyService,
                    membershipService,
                    userService,
                ),
            inject: [
                company_service_token,
                company_membership_service_token,
                user_service_token,
            ],
        },
        {
            provide: list_members_usecase_token,
            useFactory: (
                memberships: CompanyMembershipService,
                users: any,
            ) => new ListMembersUseCase(memberships, users),
            inject: [company_membership_service_token, user_service_token],
        },
        {
            provide: remove_member_usecase_token,
            useFactory: (s: CompanyMembershipService) =>
                new RemoveMemberUseCase(s),
            inject: [company_membership_service_token],
        },
        {
            provide: suspend_company_usecase_token,
            useFactory: (svc: CompanyService, audit: AuditLogService) =>
                new SuspendCompanyUseCase(svc, audit),
            inject: [company_service_token, AuditLogService],
        },
        {
            provide: reinstate_company_usecase_token,
            useFactory: (svc: CompanyService, audit: AuditLogService) =>
                new ReinstateCompanyUseCase(svc, audit),
            inject: [company_service_token, AuditLogService],
        },
        {
            provide: delete_company_usecase_token,
            useFactory: (
                svc: CompanyService,
                events: EventService,
                tickets: TicketService,
                audit: AuditLogService,
            ) => new DeleteCompanyUseCase(svc, events, tickets, audit),
            inject: [
                company_service_token,
                event_service_token,
                ticket_service_token,
                AuditLogService,
            ],
        },
        TenantGuard,
    ],
    controllers: [CompaniesController, AdminCompaniesController],
    exports: [
        company_service_token,
        company_membership_service_token,
        TenantGuard,
    ],
})
export class CompaniesModule {}
