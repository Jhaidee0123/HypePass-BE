import { BaseProps } from '../../../shared/domain/types/base.props';
import { PaymentGatewayName } from './payment-gateway-name';

/**
 * One row per (company, gateway) pair. The marketplace platform
 * (HypePass) stores tokens needed to charge in the seller's name —
 * encrypted at rest with `CryptoService`.
 */
export type CompanyPaymentGatewayCredentialProps = BaseProps & {
    companyId: string;
    gateway: PaymentGatewayName;
    isActive: boolean;
    /** Application fee in basis points (e.g. 800 = 8%). Stored per-row so
     *  HypePass can negotiate special fees per organizer. */
    applicationFeePct: number;

    // === MercadoPago specific (null for other gateways) ===
    /** MP user_id of the seller — the value MP returns from /users/me. */
    mpUserId?: string | null;
    /** Encrypted access_token (180-day lifespan). */
    mpAccessTokenEnc?: string | null;
    /** Encrypted refresh_token (longer-lived, used to renew). */
    mpRefreshTokenEnc?: string | null;
    /** Public key the FE needs to load MP's checkout SDK on the seller's
     *  context. Not sensitive — safe to store plain. */
    mpPublicKey?: string | null;
    /** When the access_token expires. Null until OAuth completes. */
    mpTokenExpiresAt?: Date | null;
    /** OAuth scopes granted (comma-separated). */
    mpScopes?: string | null;
};
