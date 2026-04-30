import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';

export type CompanyMemberView = {
    id: string;
    companyId: string;
    userId: string;
    role: string;
    /** Resolved from the user table — falls back to placeholders when the
     *  user has been deleted/scrubbed. */
    email: string;
    name: string;
    createdAt: Date;
};

/**
 * Lists every membership of a company with the user's email/name resolved
 * in one pass. Used by the organizer's "Members" panel so it can show real
 * identities instead of opaque user IDs.
 */
export class ListMembersUseCase {
    constructor(
        private readonly memberships: ICompanyMembershipRepository,
        private readonly users: IUserRepository,
    ) {}

    async execute(companyId: string): Promise<CompanyMemberView[]> {
        const rows = await this.memberships.findByCompany(companyId);
        const out: CompanyMemberView[] = [];
        for (const m of rows) {
            const u = await this.users.findById(m.userId);
            out.push({
                id: m.id,
                companyId: m.companyId,
                userId: m.userId,
                role: m.role,
                email: u?.email ?? '(unknown)',
                name: u?.name ?? '(unknown)',
                createdAt: m.createdAt ?? new Date(0),
            });
        }
        return out;
    }
}
