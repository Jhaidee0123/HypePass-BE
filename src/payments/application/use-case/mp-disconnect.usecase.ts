import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';
import { CompanyPaymentGatewayCredentialEntity } from '../../domain/entities/company-payment-gateway-credential.entity';
import { CompanyPaymentGatewayCredentialService } from '../services/company-payment-gateway-credential.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

/**
 * Soft-disconnect: marks the credential row as inactive and clears the
 * tokens (overwrites with null). The seller has to redo OAuth to
 * reconnect. We don't hard-delete the row so audit trail of past
 * settlements stays intact.
 */
export class MpDisconnectUseCase {
    constructor(
        private readonly creds: CompanyPaymentGatewayCredentialService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(companyId: string, actorUserId: string): Promise<void> {
        const existing = await this.creds.findOne(companyId, 'mercadopago');
        if (!existing) {
            throw new NotFoundDomainException(
                'Company has no MercadoPago connection',
            );
        }

        await this.creds.update(
            new CompanyPaymentGatewayCredentialEntity({
                ...(existing as any),
                id: existing.id,
                createdAt: existing.createdAt,
                isActive: false,
                mpAccessTokenEnc: null,
                mpRefreshTokenEnc: null,
                mpTokenExpiresAt: null,
                updatedAt: new Date(),
            }),
        );

        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'payment.gateway_disconnected',
                targetType: 'company',
                targetId: companyId,
                metadata: { gateway: 'mercadopago' },
            })
            .catch(() => undefined);
    }
}
