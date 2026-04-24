import { UserEntity } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../orm/user.orm.entity';

export class UserMapper {
    static toDomain(orm: UserOrmEntity): UserEntity {
        return new UserEntity({
            id: orm.id,
            email: orm.email,
            name: orm.name,
            emailVerified: orm.emailVerified,
            image: orm.image,
            role: orm.role,
            banned: orm.banned,
            phoneNumber: orm.phoneNumber,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }
}
