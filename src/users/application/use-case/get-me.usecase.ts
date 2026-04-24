import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';

export class GetMeUseCase {
    constructor(private readonly service: IUserRepository) {}

    async execute(userId: string): Promise<UserEntity> {
        const user = await this.service.findById(userId);
        if (!user) throw new NotFoundDomainException('User not found');
        return user;
    }
}
