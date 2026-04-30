import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { EventsModule } from '../events/events.module';
import { TicketsModule } from '../tickets/tickets.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../shared/infrastructure/services/email.service';
import { AuditLogService } from '../audit/application/services/audit-log.service';
import { PayoutMethodsModule } from '../payout-methods/payout-methods.module';
import { payout_method_service_token } from '../payout-methods/infrastructure/tokens/payout-methods.tokens';
import {
    event_service_token,
    event_session_service_token,
    ticket_section_service_token,
} from '../events/infrastructure/tokens/events.tokens';
import {
    order_service_token,
    ticket_qr_token_service_token,
    ticket_service_token,
} from '../tickets/infrastructure/tokens/tickets.tokens';
import {
    payment_gateway_token,
    payment_service_token,
} from '../payments/infrastructure/tokens/payments.tokens';
import { user_service_token } from '../users/infrastructure/tokens/users.tokens';
import { ResaleListingOrmEntity } from './infrastructure/orm/resale-listing.orm.entity';
import { ResaleOrderOrmEntity } from './infrastructure/orm/resale-order.orm.entity';
import { PayoutRecordOrmEntity } from './infrastructure/orm/payout-record.orm.entity';
import { ResaleListingService } from './application/services/resale-listing.service';
import { ResaleOrderService } from './application/services/resale-order.service';
import { PayoutRecordService } from './application/services/payout-record.service';
import {
    cancel_resale_listing_use_case_token,
    create_resale_listing_use_case_token,
    disperse_payout_usecase_token,
    get_resale_listing_use_case_token,
    initiate_resale_checkout_use_case_token,
    list_active_resale_listings_use_case_token,
    list_my_payouts_usecase_token,
    list_my_resale_listings_use_case_token,
    list_payouts_use_case_token,
    mark_payout_use_case_token,
    payout_record_service_token,
    resale_listing_service_token,
    resale_order_service_token,
    settle_resale_order_use_case_token,
    update_resale_listing_use_case_token,
} from './infrastructure/tokens/marketplace.tokens';
import { CreateResaleListingUseCase } from './application/use-case/create-resale-listing.usecase';
import { UpdateResaleListingUseCase } from './application/use-case/update-resale-listing.usecase';
import { CancelResaleListingUseCase } from './application/use-case/cancel-resale-listing.usecase';
import { ListMyResaleListingsUseCase } from './application/use-case/list-my-resale-listings.usecase';
import { ListActiveResaleListingsUseCase } from './application/use-case/list-active-resale-listings.usecase';
import { GetResaleListingUseCase } from './application/use-case/get-resale-listing.usecase';
import { InitiateResaleCheckoutUseCase } from './application/use-case/initiate-resale-checkout.usecase';
import { SettleResaleOrderUseCase } from './application/use-case/settle-resale-order.usecase';
import { ListPayoutsUseCase } from './application/use-case/admin/list-payouts.usecase';
import { MarkPayoutUseCase } from './application/use-case/admin/mark-payout.usecase';
import { DispersePayoutUseCase } from './application/use-case/disperse-payout.usecase';
import { ListMyPayoutsUseCase } from './application/use-case/list-my-payouts.usecase';
import { WompiPayoutsService } from '../payments/infrastructure/services/wompi-payouts.service';
import { MarketController } from './infrastructure/controllers/market.controller';
import { WalletListingsController } from './infrastructure/controllers/wallet-listings.controller';
import { AdminPayoutsController } from './infrastructure/controllers/admin-payouts.controller';
import { MyPayoutsController } from './infrastructure/controllers/my-payouts.controller';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            ResaleListingOrmEntity,
            ResaleOrderOrmEntity,
            PayoutRecordOrmEntity,
        ]),
        EventsModule,
        TicketsModule,
        PaymentsModule,
        UsersModule,
        PayoutMethodsModule,
    ],
    providers: [
        { provide: resale_listing_service_token, useClass: ResaleListingService },
        { provide: resale_order_service_token, useClass: ResaleOrderService },
        { provide: payout_record_service_token, useClass: PayoutRecordService },
        {
            provide: create_resale_listing_use_case_token,
            useFactory: (
                ds: DataSource,
                ev,
                ses,
                sec,
                listing,
                payoutMethod,
                config: ConfigService,
            ) =>
                new CreateResaleListingUseCase(
                    ds,
                    ev,
                    ses,
                    sec,
                    listing,
                    payoutMethod,
                    {
                        platformFeePct: Number(
                            config.get<number>(
                                'PLATFORM_FEE_PERCENTAGE_RESALE',
                                10,
                            ),
                        ),
                        priceCapMultiplier: Number(
                            config.get<number>(
                                'RESALE_PRICE_CAP_MULTIPLIER',
                                1.2,
                            ),
                        ),
                        maxDays: Number(
                            config.get<number>('RESALE_MAX_DAYS', 30),
                        ),
                    },
                ),
            inject: [
                DataSource,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                resale_listing_service_token,
                payout_method_service_token,
                ConfigService,
            ],
        },
        {
            provide: cancel_resale_listing_use_case_token,
            useFactory: (ds: DataSource, listing) =>
                new CancelResaleListingUseCase(ds, listing),
            inject: [DataSource, resale_listing_service_token],
        },
        {
            provide: update_resale_listing_use_case_token,
            useFactory: (listing, ticket, event, config: ConfigService) =>
                new UpdateResaleListingUseCase(listing, ticket, event, {
                    platformFeePct: Number(
                        config.get<number>(
                            'PLATFORM_FEE_PERCENTAGE_RESALE',
                            10,
                        ),
                    ),
                    priceCapMultiplier: Number(
                        config.get<number>(
                            'RESALE_PRICE_CAP_MULTIPLIER',
                            1.2,
                        ),
                    ),
                }),
            inject: [
                resale_listing_service_token,
                ticket_service_token,
                event_service_token,
                ConfigService,
            ],
        },
        {
            provide: list_my_resale_listings_use_case_token,
            useFactory: (listing) => new ListMyResaleListingsUseCase(listing),
            inject: [resale_listing_service_token],
        },
        {
            provide: list_active_resale_listings_use_case_token,
            useFactory: (listing, ticket, ev, ses, sec) =>
                new ListActiveResaleListingsUseCase(
                    listing,
                    ticket,
                    ev,
                    ses,
                    sec,
                ),
            inject: [
                resale_listing_service_token,
                ticket_service_token,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
            ],
        },
        {
            provide: get_resale_listing_use_case_token,
            useFactory: (listing, ticket, ev, ses, sec) =>
                new GetResaleListingUseCase(listing, ticket, ev, ses, sec),
            inject: [
                resale_listing_service_token,
                ticket_service_token,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
            ],
        },
        {
            provide: initiate_resale_checkout_use_case_token,
            useFactory: (
                ds: DataSource,
                listing,
                resaleOrder,
                order,
                payment,
                gateway,
                config: ConfigService,
            ) =>
                new InitiateResaleCheckoutUseCase(
                    ds,
                    listing,
                    resaleOrder,
                    order,
                    payment,
                    gateway,
                    {
                        reservationMinutes: Number(
                            config.get<number>(
                                'RESALE_RESERVATION_MINUTES',
                                10,
                            ),
                        ),
                    },
                ),
            inject: [
                DataSource,
                resale_listing_service_token,
                resale_order_service_token,
                order_service_token,
                payment_service_token,
                payment_gateway_token,
                ConfigService,
            ],
        },
        {
            provide: list_payouts_use_case_token,
            useFactory: (payout) => new ListPayoutsUseCase(payout),
            inject: [payout_record_service_token],
        },
        {
            provide: mark_payout_use_case_token,
            useFactory: (payout, audit: AuditLogService) =>
                new MarkPayoutUseCase(payout, audit),
            inject: [payout_record_service_token, AuditLogService],
        },
        {
            provide: disperse_payout_usecase_token,
            useFactory: (
                payouts,
                payoutMethod,
                user,
                wompiPayouts: WompiPayoutsService,
                audit: AuditLogService,
            ) =>
                new DispersePayoutUseCase(
                    payouts,
                    payoutMethod,
                    user,
                    wompiPayouts,
                    audit,
                ),
            inject: [
                payout_record_service_token,
                payout_method_service_token,
                user_service_token,
                WompiPayoutsService,
                AuditLogService,
            ],
        },
        {
            provide: list_my_payouts_usecase_token,
            useFactory: (payouts) => new ListMyPayoutsUseCase(payouts),
            inject: [payout_record_service_token],
        },
        {
            provide: settle_resale_order_use_case_token,
            useFactory: (
                ds: DataSource,
                resaleOrder,
                order,
                payout,
                qrToken,
                user,
                email: EmailService,
                session,
                payoutMethod,
                config: ConfigService,
            ) =>
                new SettleResaleOrderUseCase(
                    ds,
                    resaleOrder,
                    order,
                    payout,
                    qrToken,
                    user,
                    email,
                    session,
                    payoutMethod,
                    {
                        escrowHoursAfterEvent: Number(
                            config.get<number>(
                                'PAYOUT_ESCROW_HOURS_AFTER_EVENT',
                                48,
                            ),
                        ),
                    },
                ),
            inject: [
                DataSource,
                resale_order_service_token,
                order_service_token,
                payout_record_service_token,
                ticket_qr_token_service_token,
                user_service_token,
                EmailService,
                event_session_service_token,
                payout_method_service_token,
                ConfigService,
            ],
        },
    ],
    controllers: [
        MarketController,
        WalletListingsController,
        AdminPayoutsController,
        MyPayoutsController,
    ],
    exports: [
        resale_listing_service_token,
        resale_order_service_token,
        payout_record_service_token,
        settle_resale_order_use_case_token,
        disperse_payout_usecase_token,
    ],
})
export class MarketplaceModule {}
