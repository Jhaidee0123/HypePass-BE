import { Injectable } from '@nestjs/common';
import {
    AdminUserListResult,
    AdminUserService,
} from '../services/admin-user.service';
import { ListAdminUsersQueryDto } from '../dto/list-admin-users.dto';

@Injectable()
export class AdminListUsersUseCase {
    constructor(private readonly svc: AdminUserService) {}

    execute(query: ListAdminUsersQueryDto): Promise<AdminUserListResult> {
        return this.svc.list({
            q: query.q,
            role: query.role,
            banned:
                query.banned === undefined
                    ? undefined
                    : query.banned === 'true',
            limit: query.limit,
            offset: query.offset,
        });
    }
}
