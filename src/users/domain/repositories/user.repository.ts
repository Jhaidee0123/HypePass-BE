import { UserEntity } from '../entities/user.entity';
import { UserQueryFilter } from '../types/user-query-filter';

export interface IUserRepository {
    findAll(query?: UserQueryFilter): Promise<UserEntity[]>;
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
}
