import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../../infrastructure/orm/user.orm.entity';
import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';

export type AdminUserRow = {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image: string | null;
    role: string;
    banned: boolean;
    banReason: string | null;
    banExpires: string | null;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string;
};

export type AdminUserListResult = {
    items: AdminUserRow[];
    total: number;
    limit: number;
    offset: number;
};

export type ListAdminUsersFilter = {
    q?: string;
    role?: 'user' | 'platform_admin';
    banned?: boolean;
    limit?: number;
    offset?: number;
};

const toRow = (orm: UserOrmEntity): AdminUserRow => ({
    id: orm.id,
    email: orm.email,
    name: orm.name,
    emailVerified: orm.emailVerified,
    image: orm.image,
    role: orm.role,
    banned: orm.banned === true,
    banReason: orm.banReason,
    banExpires: orm.banExpires ? orm.banExpires.toISOString() : null,
    phoneNumber: orm.phoneNumber,
    createdAt: orm.createdAt.toISOString(),
    updatedAt: orm.updatedAt.toISOString(),
});

@Injectable()
export class AdminUserService {
    constructor(
        @InjectRepository(UserOrmEntity)
        private readonly repo: Repository<UserOrmEntity>,
    ) {}

    async list(filter: ListAdminUsersFilter): Promise<AdminUserListResult> {
        const limit = filter.limit ?? 50;
        const offset = filter.offset ?? 0;
        const qb = this.repo
            .createQueryBuilder('u')
            .orderBy('u.createdAt', 'DESC')
            .take(limit)
            .skip(offset);

        if (filter.q) {
            const needle = `%${filter.q}%`;
            qb.andWhere('(u.email ILIKE :n OR u.name ILIKE :n)', { n: needle });
        }
        if (filter.role) {
            qb.andWhere('u.role = :role', { role: filter.role });
        }
        if (filter.banned !== undefined) {
            if (filter.banned) qb.andWhere('u.banned = true');
            else qb.andWhere('(u.banned IS NULL OR u.banned = false)');
        }

        const [rows, total] = await qb.getManyAndCount();
        return { items: rows.map(toRow), total, limit, offset };
    }

    async getById(id: string): Promise<AdminUserRow> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundDomainException(`user ${id} not found`);
        return toRow(row);
    }

    async setRole(id: string, role: 'user' | 'platform_admin'): Promise<AdminUserRow> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundDomainException(`user ${id} not found`);
        await this.repo.update({ id }, { role });
        const next = await this.repo.findOne({ where: { id } });
        return toRow(next!);
    }

    async ban(
        id: string,
        reason: string,
        expiresAt: Date | null,
    ): Promise<AdminUserRow> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundDomainException(`user ${id} not found`);
        await this.repo.update(
            { id },
            { banned: true, banReason: reason, banExpires: expiresAt },
        );
        const next = await this.repo.findOne({ where: { id } });
        return toRow(next!);
    }

    async unban(id: string): Promise<AdminUserRow> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundDomainException(`user ${id} not found`);
        await this.repo.update(
            { id },
            { banned: false, banReason: null, banExpires: null },
        );
        const next = await this.repo.findOne({ where: { id } });
        return toRow(next!);
    }

    /**
     * Soft-delete: scrubs personal info, banes the account permanently and
     * marks the row with a magic ban reason so the UI can render it as
     * "[deleted]". The user_id keeps existing as a foreign key for orders,
     * tickets, audit logs and other historical references.
     */
    async softDelete(id: string): Promise<AdminUserRow> {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundDomainException(`user ${id} not found`);
        const scrubbedEmail = `deleted-${id}@hypepass.invalid`;
        await this.repo.update(
            { id },
            {
                email: scrubbedEmail,
                name: '[deleted user]',
                emailVerified: false,
                image: null,
                phoneNumber: null,
                banned: true,
                banReason: 'ACCOUNT_DELETED',
                banExpires: null,
            },
        );
        const next = await this.repo.findOne({ where: { id } });
        return toRow(next!);
    }
}
