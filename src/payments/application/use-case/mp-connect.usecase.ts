import { Logger } from '@nestjs/common';
import { MercadoPagoOAuthService } from '../services/mercadopago-oauth.service';
import { CompanyPaymentGatewayCredentialService } from '../services/company-payment-gateway-credential.service';
import { CompanyPaymentGatewayCredentialEntity } from '../../domain/entities/company-payment-gateway-credential.entity';
import { CryptoService } from '../../../shared/infrastructure/services/crypto.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

/**
 * Handles the OAuth callback from MercadoPago after the seller authorized
 * HypePass to charge in their name. Exchanges the `code` for tokens and
 * persists them encrypted, tied to the `companyId` carried in `state`.
 */
export class MpConnectUseCase {
    private readonly logger = new Logger(MpConnectUseCase.name);

    constructor(
        private readonly oauth: MercadoPagoOAuthService,
        private readonly creds: CompanyPaymentGatewayCredentialService,
        private readonly crypto: CryptoService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        code: string,
        state: string,
        actorUserId: string,
    ): Promise<{ companyId: string }> {
        // Verifies HMAC + extracts companyId from `state`
        const companyId = this.oauth.verifyState(state);

        // Exchange code → tokens
        const tokens = await this.oauth.exchangeCode(code);

        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
        const accessTokenEnc = this.crypto.encrypt(tokens.access_token);
        const refreshTokenEnc = this.crypto.encrypt(tokens.refresh_token);

        // Upsert credentials: if already connected (re-auth), refresh
        // the tokens; otherwise create a new row.
        const existing = await this.creds.findOne(companyId, 'mercadopago');
        if (existing) {
            const updated = new CompanyPaymentGatewayCredentialEntity({
                ...(existing as any),
                id: existing.id,
                createdAt: existing.createdAt,
                isActive: true,
                mpUserId: String(tokens.user_id),
                mpAccessTokenEnc: accessTokenEnc,
                mpRefreshTokenEnc: refreshTokenEnc,
                mpPublicKey: tokens.public_key,
                mpTokenExpiresAt: expiresAt,
                mpScopes: tokens.scope,
                updatedAt: new Date(),
            });
            await this.creds.update(updated);
        } else {
            await this.creds.create(
                new CompanyPaymentGatewayCredentialEntity({
                    companyId,
                    gateway: 'mercadopago',
                    isActive: true,
                    applicationFeePct: 800, // 8% default — configurable later
                    mpUserId: String(tokens.user_id),
                    mpAccessTokenEnc: accessTokenEnc,
                    mpRefreshTokenEnc: refreshTokenEnc,
                    mpPublicKey: tokens.public_key,
                    mpTokenExpiresAt: expiresAt,
                    mpScopes: tokens.scope,
                }),
            );
        }

        void this.audit
            .record({
                actorKind: 'user',
                actorUserId,
                action: 'payment.gateway_connected',
                targetType: 'company',
                targetId: companyId,
                metadata: {
                    gateway: 'mercadopago',
                    mpUserId: String(tokens.user_id),
                    scopes: tokens.scope,
                },
            })
            .catch(() => undefined);

        return { companyId };
    }
}
