import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session } from '../../../auth/decorators/session.decorator';
import { CompanyRoles } from '../../../auth/decorators/company-roles.decorator';
import { COMPANY_ROLES, UserSession } from '../../../auth';
import { CreateCompanyDto } from '../../application/dto/create-company.dto';
import { AddMemberDto } from '../../application/dto/add-member.dto';
import {
    add_member_usecase_token,
    create_company_usecase_token,
    list_members_usecase_token,
    list_my_companies_usecase_token,
    remove_member_usecase_token,
} from '../tokens/companies.tokens';
import { CreateCompanyUseCase } from '../../application/use-case/create-company.usecase';
import { ListMyCompaniesUseCase } from '../../application/use-case/list-my-companies.usecase';
import { AddMemberUseCase } from '../../application/use-case/add-member.usecase';
import { ListMembersUseCase } from '../../application/use-case/list-members.usecase';
import { RemoveMemberUseCase } from '../../application/use-case/remove-member.usecase';
import { TenantGuard } from '../guards/tenant.guard';

@ApiTags('Companies')
@ApiCookieAuth()
@Controller('companies')
export class CompaniesController {
    constructor(
        @Inject(create_company_usecase_token)
        private readonly createCompany: CreateCompanyUseCase,
        @Inject(list_my_companies_usecase_token)
        private readonly listMine: ListMyCompaniesUseCase,
        @Inject(add_member_usecase_token)
        private readonly addMember: AddMemberUseCase,
        @Inject(list_members_usecase_token)
        private readonly listMembers: ListMembersUseCase,
        @Inject(remove_member_usecase_token)
        private readonly removeMember: RemoveMemberUseCase,
    ) {}

    @Post()
    create(@Body() dto: CreateCompanyDto, @Session() session: UserSession) {
        return this.createCompany.execute(dto, session.user.id);
    }

    @Get('mine')
    mine(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }

    @Get(':companyId/members')
    @UseGuards(TenantGuard)
    @CompanyRoles([COMPANY_ROLES.OWNER, COMPANY_ROLES.ADMIN])
    members(@Param('companyId') companyId: string) {
        return this.listMembers.execute(companyId);
    }

    @Post(':companyId/members')
    @UseGuards(TenantGuard)
    @CompanyRoles([COMPANY_ROLES.OWNER, COMPANY_ROLES.ADMIN])
    add(
        @Param('companyId') companyId: string,
        @Body() dto: AddMemberDto,
    ) {
        return this.addMember.execute(companyId, dto);
    }
}
