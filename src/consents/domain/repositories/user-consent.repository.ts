import { UserConsentEntity } from '../entities/user-consent.entity';

export interface IUserConsentRepository {
    findById(id: string): Promise<UserConsentEntity | null>;
    findByUser(userId: string): Promise<UserConsentEntity[]>;
    findLatestForUser(userId: string): Promise<UserConsentEntity | null>;
    create(entity: UserConsentEntity): Promise<UserConsentEntity>;
}
