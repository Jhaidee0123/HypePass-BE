import { SetMetadata } from '@nestjs/common';
import { CompanyRole } from '../constants';

export const COMPANY_ROLES_KEY = 'companyRoles';

/**
 * Decorator used together with TenantGuard. Restricts a route to users whose
 * membership role in the target company is included in `roles`.
 *
 * Example:
 *   @CompanyRoles(['owner', 'admin'])
 */
export const CompanyRoles = (roles: CompanyRole[]) =>
    SetMetadata(COMPANY_ROLES_KEY, roles);
