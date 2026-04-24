import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { UserQueryFilter } from '../../domain/types/user-query-filter';

export class ListUsersUseCase {
    constructor(private readonly service: IUserRepository) {}

    execute(query?: UserQueryFilter): Promise<UserEntity[]> {
        return this.service.findAll(query);
    }
}
