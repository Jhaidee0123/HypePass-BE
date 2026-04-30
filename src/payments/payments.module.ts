import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrmEntity } from './infrastructure/orm/payment.orm.entity';
import { PaymentWebhookEventOrmEntity } from './infrastructure/orm/payment-webhook-event.orm.entity';
import { CompanyPaymentGatewayCredentialOrmEntity } from './infrastructure/orm/company-payment-gateway-credential.orm.entity';
import { PaymentService } from './application/services/payment.service';
import { PaymentWebhookEventService } from './application/services/payment-webhook-event.service';
import { CompanyPaymentGatewayCredentialService } from './application/services/company-payment-gateway-credential.service';
import { PaymentGatewayRegistry } from './application/services/payment-gateway-registry.service';
import { MercadoPagoOAuthService } from './application/services/mercadopago-oauth.service';
import { MpConnectUseCase } from './application/use-case/mp-connect.usecase';
import { MpDisconnectUseCase } from './application/use-case/mp-disconnect.usecase';
import { ListCompanyPaymentGatewaysUseCase } from './application/use-case/list-company-payment-gateways.usecase';
import { WompiService } from './infrastructure/services/wompi.service';
import { WompiPayoutsService } from './infrastructure/services/wompi-payouts.service';
import { MercadoPagoService } from './infrastructure/services/mercadopago.service';
import { MercadoPagoOAuthController } from './infrastructure/controllers/mercadopago-oauth.controller';
import { CompaniesModule } from '../companies/companies.module';
import { AuditLogService } from '../audit/application/services/audit-log.service';
import { CryptoService } from '../shared/infrastructure/services/crypto.service';
import {
    company_payment_gateway_credential_service_token,
    list_company_payment_gateways_usecase_token,
    mp_connect_usecase_token,
    mp_disconnect_usecase_token,
    payment_gateway_token,
    payment_service_token,
    payment_webhook_event_service_token,
} from './infrastructure/tokens/payments.tokens';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([
            PaymentOrmEntity,
            PaymentWebhookEventOrmEntity,
            CompanyPaymentGatewayCredentialOrmEntity,
        ]),
        forwardRef(() => CompaniesModule),
    ],
    providers: [
        WompiService,
        WompiPayoutsService,
        MercadoPagoService,
        MercadoPagoOAuthService,
        CompanyPaymentGatewayCredentialService,
        PaymentGatewayRegistry,
        {
            provide: company_payment_gateway_credential_service_token,
            useExisting: CompanyPaymentGatewayCredentialService,
        },
        { provide: payment_gateway_token, useExisting: WompiService },
        { provide: payment_service_token, useClass: PaymentService },
        {
            provide: payment_webhook_event_service_token,
            useClass: PaymentWebhookEventService,
        },
        {
            provide: mp_connect_usecase_token,
            useFactory: (
                oauth: MercadoPagoOAuthService,
                creds: CompanyPaymentGatewayCredentialService,
                crypto: CryptoService,
                audit: AuditLogService,
            ) => new MpConnectUseCase(oauth, creds, crypto, audit),
            inject: [
                MercadoPagoOAuthService,
                CompanyPaymentGatewayCredentialService,
                CryptoService,
                AuditLogService,
            ],
        },
        {
            provide: mp_disconnect_usecase_token,
            useFactory: (
                creds: CompanyPaymentGatewayCredentialService,
                audit: AuditLogService,
            ) => new MpDisconnectUseCase(creds, audit),
            inject: [
                CompanyPaymentGatewayCredentialService,
                AuditLogService,
            ],
        },
        {
            provide: list_company_payment_gateways_usecase_token,
            useFactory: (
                creds: CompanyPaymentGatewayCredentialService,
            ) => new ListCompanyPaymentGatewaysUseCase(creds),
            inject: [CompanyPaymentGatewayCredentialService],
        },
    ],
    controllers: [MercadoPagoOAuthController],
    exports: [
        payment_gateway_token,
        payment_service_token,
        payment_webhook_event_service_token,
        company_payment_gateway_credential_service_token,
        WompiService,
        WompiPayoutsService,
        MercadoPagoService,
        PaymentGatewayRegistry,
        CompanyPaymentGatewayCredentialService,
    ],
})
export class PaymentsModule {}
