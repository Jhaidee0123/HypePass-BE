import { UserConsentEntity } from '../../domain/entities/user-consent.entity';
import { UserConsentOrmEntity } from '../orm/user-consent.orm.entity';

export class UserConsentMapper {
    static toDomain(orm: UserConsentOrmEntity): UserConsentEntity {
        return new UserConsentEntity({
            id: orm.id,
            userId: orm.userId,
            termsVersion: orm.termsVersion,
            privacyVersion: orm.privacyVersion,
            source: orm.source,
            ipAddress: orm.ipAddress,
            userAgent: orm.userAgent,
            acceptedAt: orm.acceptedAt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: UserConsentEntity,
    ): Partial<UserConsentOrmEntity> {
        return {
            id: entity.id,
            userId: entity.userId,
            termsVersion: entity.termsVersion,
            privacyVersion: entity.privacyVersion,
            source: entity.source,
            ipAddress: entity.ipAddress ?? null,
            userAgent: entity.userAgent ?? null,
            acceptedAt: entity.acceptedAt,
        };
    }
}
