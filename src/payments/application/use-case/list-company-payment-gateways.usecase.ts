import { CompanyPaymentGatewayCredentialService } from '../services/company-payment-gateway-credential.service';
import { PaymentGatewayName } from '../../domain/types/payment-gateway-name';

export type CompanyGatewayStatus = {
    gateway: PaymentGatewayName;
    isActive: boolean;
    /** True only when the row exists AND has all required fields to
     *  actually charge (e.g. for MP, both tokens + public_key set). */
    isReady: boolean;
    applicationFeePct: number;
    mpUserId?: string | null;
    mpScopes?: string | null;
    mpTokenExpiresAt?: string | null;
    connectedAt?: string;
};

/**
 * Returns the connection status of every gateway for a company. The FE
 * uses this to render the "Conectar pasarela" panel and decide which
 * gateway is ready to receive payments.
 */
export class ListCompanyPaymentGatewaysUseCase {
    constructor(
        private readonly creds: CompanyPaymentGatewayCredentialService,
    ) {}

    async execute(companyId: string): Promise<CompanyGatewayStatus[]> {
        const rows = await this.creds.findByCompany(companyId);
        return rows.map((r) => ({
            gateway: r.gateway,
            isActive: r.isActive,
            isReady:
                r.gateway === 'mercadopago'
                    ? !!(r.mpAccessTokenEnc && r.mpPublicKey && r.isActive)
                    : r.isActive,
            applicationFeePct: r.applicationFeePct,
            mpUserId: r.mpUserId ?? null,
            mpScopes: r.mpScopes ?? null,
            mpTokenExpiresAt: r.mpTokenExpiresAt
                ? r.mpTokenExpiresAt.toISOString()
                : null,
            connectedAt: r.createdAt
                ? r.createdAt.toISOString()
                : undefined,
        }));
    }
}
