import { CompanyPaymentGatewayCredentialEntity } from '../../domain/entities/company-payment-gateway-credential.entity';
import { CompanyPaymentGatewayCredentialOrmEntity } from '../orm/company-payment-gateway-credential.orm.entity';

export class CompanyPaymentGatewayCredentialMapper {
    static toDomain(
        orm: CompanyPaymentGatewayCredentialOrmEntity,
    ): CompanyPaymentGatewayCredentialEntity {
        return new CompanyPaymentGatewayCredentialEntity({
            id: orm.id,
            companyId: orm.companyId,
            gateway: orm.gateway,
            isActive: orm.isActive,
            applicationFeePct: orm.applicationFeePct,
            mpUserId: orm.mpUserId,
            mpAccessTokenEnc: orm.mpAccessTokenEnc,
            mpRefreshTokenEnc: orm.mpRefreshTokenEnc,
            mpPublicKey: orm.mpPublicKey,
            mpTokenExpiresAt: orm.mpTokenExpiresAt,
            mpScopes: orm.mpScopes,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(
        entity: CompanyPaymentGatewayCredentialEntity,
    ): Partial<CompanyPaymentGatewayCredentialOrmEntity> {
        return {
            id: entity.id,
            companyId: entity.companyId,
            gateway: entity.gateway,
            isActive: entity.isActive,
            applicationFeePct: entity.applicationFeePct,
            mpUserId: entity.mpUserId ?? null,
            mpAccessTokenEnc: entity.mpAccessTokenEnc ?? null,
            mpRefreshTokenEnc: entity.mpRefreshTokenEnc ?? null,
            mpPublicKey: entity.mpPublicKey ?? null,
            mpTokenExpiresAt: entity.mpTokenExpiresAt ?? null,
            mpScopes: entity.mpScopes ?? null,
        };
    }
}
