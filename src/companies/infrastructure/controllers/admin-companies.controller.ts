import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session } from '../../../auth/decorators';
import { SYSTEM_ROLES, UserSession } from '../../../auth';
import { ReviewCompanyDto } from '../../application/dto/review-company.dto';
import { CompanyStatus } from '../../domain/types/company-status';
import {
    approve_company_usecase_token,
    list_companies_usecase_token,
    reject_company_usecase_token,
} from '../tokens/companies.tokens';
import { ListCompaniesUseCase } from '../../application/use-case/list-companies.usecase';
import { ApproveCompanyUseCase } from '../../application/use-case/approve-company.usecase';
import { RejectCompanyUseCase } from '../../application/use-case/reject-company.usecase';

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
    ) {}

    @Get()
    list(@Query('status') status?: CompanyStatus) {
        return this.listCompanies.execute({ status });
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
}
