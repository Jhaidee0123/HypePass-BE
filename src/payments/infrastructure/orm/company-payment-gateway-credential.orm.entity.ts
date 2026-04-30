import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { PaymentGatewayName } from '../../domain/types/payment-gateway-name';

@Entity({ name: 'company_payment_gateway_credentials' })
@Unique('uq_company_gateway', ['companyId', 'gateway'])
export class CompanyPaymentGatewayCredentialOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'company_id' })
    companyId: string;

    @Column({ type: 'varchar', length: 30 })
    gateway: PaymentGatewayName;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    /** Stored as integer percentage × 100 (e.g. 800 = 8.00%). Avoids
     *  float precision issues when computing the application_fee_amount
     *  in cents on each order. */
    @Column('integer', {
        name: 'application_fee_pct',
        default: 800,
    })
    applicationFeePct: number;

    @Column({ type: 'varchar', length: 50, name: 'mp_user_id', nullable: true })
    mpUserId: string | null;

    @Column({ type: 'text', name: 'mp_access_token_enc', nullable: true })
    mpAccessTokenEnc: string | null;

    @Column({ type: 'text', name: 'mp_refresh_token_enc', nullable: true })
    mpRefreshTokenEnc: string | null;

    @Column({
        type: 'varchar',
        length: 100,
        name: 'mp_public_key',
        nullable: true,
    })
    mpPublicKey: string | null;

    @Column('timestamptz', {
        name: 'mp_token_expires_at',
        nullable: true,
    })
    mpTokenExpiresAt: Date | null;

    @Column({
        type: 'varchar',
        length: 200,
        name: 'mp_scopes',
        nullable: true,
    })
    mpScopes: string | null;
}
