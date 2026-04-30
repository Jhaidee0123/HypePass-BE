import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { CompanyPaymentGatewayCredentialProps } from '../types/company-payment-gateway-credential.props';
import { PaymentGatewayName } from '../types/payment-gateway-name';

export class CompanyPaymentGatewayCredentialEntity extends BaseEntity {
    readonly companyId: string;
    readonly gateway: PaymentGatewayName;
    readonly isActive: boolean;
    readonly applicationFeePct: number;
    readonly mpUserId?: string | null;
    readonly mpAccessTokenEnc?: string | null;
    readonly mpRefreshTokenEnc?: string | null;
    readonly mpPublicKey?: string | null;
    readonly mpTokenExpiresAt?: Date | null;
    readonly mpScopes?: string | null;

    constructor(props: CompanyPaymentGatewayCredentialProps) {
        super(props);
        this.companyId = props.companyId;
        this.gateway = props.gateway;
        this.isActive = props.isActive;
        this.applicationFeePct = props.applicationFeePct;
        this.mpUserId = props.mpUserId ?? null;
        this.mpAccessTokenEnc = props.mpAccessTokenEnc ?? null;
        this.mpRefreshTokenEnc = props.mpRefreshTokenEnc ?? null;
        this.mpPublicKey = props.mpPublicKey ?? null;
        this.mpTokenExpiresAt = props.mpTokenExpiresAt ?? null;
        this.mpScopes = props.mpScopes ?? null;
    }
}
