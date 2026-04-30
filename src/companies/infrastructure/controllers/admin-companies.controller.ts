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
import { ReviewCompanyDto } from '../../application/dto/review-company.dto';
import { SuspendCompanyDto } from '../../application/dto/suspend-company.dto';
import { CompanyStatus } from '../../domain/types/company-status';
import {
    approve_company_usecase_token,
    delete_company_usecase_token,
    list_companies_usecase_token,
    reinstate_company_usecase_token,
    reject_company_usecase_token,
    suspend_company_usecase_token,
} from '../tokens/companies.tokens';
import { ListCompaniesUseCase } from '../../application/use-case/list-companies.usecase';
import { ApproveCompanyUseCase } from '../../application/use-case/approve-company.usecase';
import { RejectCompanyUseCase } from '../../application/use-case/reject-company.usecase';
import {
    ReinstateCompanyUseCase,
    SuspendCompanyUseCase,
} from '../../application/use-case/suspend-company.usecase';
import { DeleteCompanyUseCase } from '../../application/use-case/delete-company.usecase';

@ApiTags('Admin — Companies')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/companies')
export class AdminCompaniesController {
    constructor(
        @Inject(list_companies_usecase_token)
        private readonly listCompanies: ListCompaniesUseCase,
        @Inject(approve_company_usecase_token)
        private readonly approveCompany: ApproveCompanyUseCase,
        @Inject(reject_company_usecase_token)
        private readonly rejectCompany: RejectCompanyUseCase,
        @Inject(suspend_company_usecase_token)
        private readonly suspendCompany: SuspendCompanyUseCase,
        @Inject(reinstate_company_usecase_token)
        private readonly reinstateCompany: ReinstateCompanyUseCase,
        @Inject(delete_company_usecase_token)
        private readonly deleteCompany: DeleteCompanyUseCase,
    ) {}

    @Get()
    list(@Query('status') status?: CompanyStatus, @Query('search') search?: string) {
        return this.listCompanies.execute({ status, search });
    }

    @Patch(':companyId/approve')
    approve(
        @Param('companyId') companyId: string,
        @Body() dto: ReviewCompanyDto,
        @Session() session: UserSession,
    ) {
        return this.approveCompany.execute(
            companyId,
            session.user.id,
            dto,
        );
    }

    @Patch(':companyId/reject')
    reject(
        @Param('companyId') companyId: string,
        @Body() dto: ReviewCompanyDto,
        @Session() session: UserSession,
    ) {
        return this.rejectCompany.execute(companyId, session.user.id, dto);
    }

    @Patch(':companyId/suspend')
    suspend(
        @Param('companyId') companyId: string,
        @Body() dto: SuspendCompanyDto,
        @Session() session: UserSession,
    ) {
        return this.suspendCompany.execute(companyId, session.user.id, dto.reason);
    }

    @Patch(':companyId/reinstate')
    reinstate(
        @Param('companyId') companyId: string,
        @Session() session: UserSession,
    ) {
        return this.reinstateCompany.execute(companyId, session.user.id);
    }

    @Delete(':companyId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('companyId') companyId: string,
        @Session() session: UserSession,
    ) {
        await this.deleteCompany.execute(companyId, session.user.id);
    }
}
