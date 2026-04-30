import { CompanyEntity } from '../../domain/entities/company.entity';
import { CompanyOrmEntity } from '../orm/company.orm.entity';

export class CompanyMapper {
    static toDomain(orm: CompanyOrmEntity): CompanyEntity {
        return new CompanyEntity({
            id: orm.id,
            name: orm.name,
            slug: orm.slug,
            legalName: orm.legalName,
            taxId: orm.taxId,
            contactEmail: orm.contactEmail,
            logoUrl: orm.logoUrl,
            status: orm.status,
            reviewedByUserId: orm.reviewedByUserId,
            reviewedAt: orm.reviewedAt,
            reviewNotes: orm.reviewNotes,
            preferredGateway: orm.preferredGateway ?? 'wompi',
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: CompanyEntity): Partial<CompanyOrmEntity> {
        return {
            id: entity.id,
            name: entity.name,
            slug: entity.slug,
            legalName: entity.legalName ?? null,
            taxId: entity.taxId ?? null,
            contactEmail: entity.contactEmail ?? null,
            logoUrl: entity.logoUrl ?? null,
            status: entity.status,
            reviewedByUserId: entity.reviewedByUserId ?? null,
            reviewedAt: entity.reviewedAt ?? null,
            reviewNotes: entity.reviewNotes ?? null,
            preferredGateway: entity.preferredGateway ?? 'wompi',
        };
    }
}
