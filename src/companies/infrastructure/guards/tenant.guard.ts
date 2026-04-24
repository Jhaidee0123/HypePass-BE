import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { COMPANY_ROLES_KEY } from '../../../auth/decorators/company-roles.decorator';
import { CompanyRole, SYSTEM_ROLES } from '../../../auth/constants';
import { UserSession } from '../../../auth/types';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { company_membership_service_token } from '../tokens/companies.tokens';

/**
 * TenantGuard ensures the authenticated user has a membership in the
 * company identified by the route param :companyId (or :id inside
 * /companies/:id/*). Optionally enforces role via @CompanyRoles([...]).
 *
 * Platform admins bypass the check.
 */
@Injectable()
export class TenantGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(company_membership_service_token)
        private readonly memberships: ICompanyMembershipRepository,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const session: UserSession | undefined = (request as any)
            .betterAuthSession;
        if (!session) return false;

        if (session.user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
            return true;
        }

        const params = request.params ?? {};
        const companyId =
            (params as any).companyId ??
            (params as any).company_id ??
            (params as any).id;
        if (!companyId) {
            throw new NotFoundException('Company id missing from route');
        }

        const membership = await this.memberships.findOne(
            companyId,
            session.user.id,
        );
        if (!membership) {
            throw new ForbiddenException(
                'You do not belong to this company',
            );
        }

        const requiredRoles =
            this.reflector.getAllAndOverride<CompanyRole[]>(
                COMPANY_ROLES_KEY,
                [context.getHandler(), context.getClass()],
            ) ?? [];
        if (
            requiredRoles.length > 0 &&
            !requiredRoles.includes(membership.role)
        ) {
            throw new ForbiddenException(
                'Your role does not permit this action',
            );
        }

        (request as any).companyMembership = membership;
        return true;
    }
}
