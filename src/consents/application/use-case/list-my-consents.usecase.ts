import { UserConsentEntity } from '../../domain/entities/user-consent.entity';
import { IUserConsentRepository } from '../../domain/repositories/user-consent.repository';

export class ListMyConsentsUseCase {
    constructor(private readonly repo: IUserConsentRepository) {}

    execute(userId: string): Promise<UserConsentEntity[]> {
        return this.repo.findByUser(userId);
    }
}
