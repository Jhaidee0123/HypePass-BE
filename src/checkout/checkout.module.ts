import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { TicketsModule } from '../tickets/tickets.module';
import { EventsModule } from '../events/events.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { settle_resale_order_use_case_token } from '../marketplace/infrastructure/tokens/marketplace.tokens';
import { ConsentsModule } from '../consents/consents.module';
import { record_consent_use_case_token } from '../consents/infrastructure/tokens/consents.tokens';
import { BETTER_AUTH } from '../auth/constants';
import { EmailService } from '../shared/infrastructure/services/email.service';
import { user_service_token } from '../users/infrastructure/tokens/users.tokens';
import {
    event_promoter_service_token,
    event_service_token,
    event_session_service_token,
    ticket_sale_phase_service_token,
    ticket_section_service_token,
} from '../events/infrastructure/tokens/events.tokens';
import { EventPromoterService } from '../events/application/services/event-promoter.service';
import {
    payment_gateway_token,
    payment_service_token,
    payment_webhook_event_service_token,
} from '../payments/infrastructure/tokens/payments.tokens';
import {
    inventory_hold_service_token,
    order_item_service_token,
    order_service_token,
    ticket_service_token,
} from '../tickets/infrastructure/tokens/tickets.tokens';
import { CheckoutController } from './infrastructure/controllers/checkout.controller';
import {
    handle_webhook_usecase_token,
    initiate_checkout_usecase_token,
    initiate_guest_checkout_usecase_token,
    verify_payment_usecase_token,
} from './infrastructure/tokens/checkout.tokens';
import { InitiateCheckoutUseCase } from './application/use-case/initiate-checkout.usecase';
import { InitiateGuestCheckoutUseCase } from './application/use-case/initiate-guest-checkout.usecase';
import { VerifyPaymentUseCase } from './application/use-case/verify-payment.usecase';
import { HandleWebhookUseCase } from './application/use-case/handle-webhook.usecase';

@Module({
    imports: [
        ConfigModule,
        EventsModule,
        TicketsModule,
        PaymentsModule,
        UsersModule,
        MarketplaceModule,
        ConsentsModule,
    ],
    providers: [
        {
            provide: initiate_checkout_usecase_token,
            useFactory: (
                ds: DataSource,
                ev,
                ses,
                sec,
                ph,
                order,
                orderItem,
                hold,
                ticket,
                payment,
                gateway,
                config: ConfigService,
                promoter: EventPromoterService,
            ) =>
                new InitiateCheckoutUseCase(
                    ds,
                    ev,
                    ses,
                    sec,
                    ph,
                    order,
                    orderItem,
                    hold,
                    ticket,
                    payment,
                    gateway,
                    {
                        platformFeePct: Number(
                            config.get<number>(
                                'PLATFORM_FEE_PERCENTAGE_PRIMARY',
                                10,
                            ),
                        ),
                        holdMinutes: Number(
                            config.get<number>('INVENTORY_HOLD_MINUTES', 10),
                        ),
                    },
                    promoter,
                ),
            inject: [
                DataSource,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                ticket_sale_phase_service_token,
                order_service_token,
                order_item_service_token,
                inventory_hold_service_token,
                ticket_service_token,
                payment_service_token,
                payment_gateway_token,
                ConfigService,
                event_promoter_service_token,
            ],
        },
        {
            provide: initiate_guest_checkout_usecase_token,
            useFactory: (
                inner: InitiateCheckoutUseCase,
                userSvc,
                email: EmailService,
                auth,
                recordConsent,
            ) =>
                new InitiateGuestCheckoutUseCase(
                    inner,
                    userSvc,
                    email,
                    auth,
                    recordConsent,
                ),
            inject: [
                initiate_checkout_usecase_token,
                user_service_token,
                EmailService,
                BETTER_AUTH,
                record_consent_use_case_token,
            ],
        },
        {
            provide: verify_payment_usecase_token,
            useFactory: (
                ds: DataSource,
                payment,
                order,
                orderItem,
                ticket,
                hold,
                gateway,
                email: EmailService,
                settleResale,
            ) =>
                new VerifyPaymentUseCase(
                    ds,
                    payment,
                    order,
                    orderItem,
                    ticket,
                    hold,
                    gateway,
                    email,
                    settleResale,
                ),
            inject: [
                DataSource,
                payment_service_token,
                order_service_token,
                order_item_service_token,
                ticket_service_token,
                inventory_hold_service_token,
                payment_gateway_token,
                EmailService,
                settle_resale_order_use_case_token,
            ],
        },
        {
            provide: handle_webhook_usecase_token,
            useFactory: (
                ds: DataSource,
                gateway,
                payment,
                webhook,
                order,
                orderItem,
                ticket,
                hold,
                email: EmailService,
                settleResale,
            ) =>
                new HandleWebhookUseCase(
                    ds,
                    gateway,
                    payment,
                    webhook,
                    order,
                    orderItem,
                    ticket,
                    hold,
                    email,
                    settleResale,
                ),
            inject: [
                DataSource,
                payment_gateway_token,
                payment_service_token,
                payment_webhook_event_service_token,
                order_service_token,
                order_item_service_token,
                ticket_service_token,
                inventory_hold_service_token,
                EmailService,
                settle_resale_order_use_case_token,
            ],
        },
    ],
    controllers: [CheckoutController],
})
export class CheckoutModule {}
