import { CompanyMembershipEntity } from '../../domain/entities/company-membership.entity';
import { CompanyMembershipOrmEntity } from '../orm/company-membership.orm.entity';

export class CompanyMembershipMapper {
    static toDomain(orm: CompanyMembershipOrmEntity): CompanyMembershipEntity {
        return new CompanyMembershipEntity({
            id: orm.id,
            companyId: orm.companyId,
            userId: orm.userId,
            role: orm.role,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: CompanyMembershipEntity,
    ): Partial<CompanyMembershipOrmEntity> {
        return {
            id: entity.id,
            companyId: entity.companyId,
            userId: entity.userId,
            role: entity.role,
        };
    }
}
