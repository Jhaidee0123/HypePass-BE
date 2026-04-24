import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import databaseConfig from './config/database.config';
import { BetterAuthModule } from './auth/better-auth.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { VenuesModule } from './venues/venues.module';
import { CategoriesModule } from './categories/categories.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WalletModule } from './wallet/wallet.module';
import { CheckinModule } from './checkin/checkin.module';
import { TransferModule } from './transfer/transfer.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { SweepersModule } from './sweepers/sweepers.module';
import { AuditModule } from './audit/audit.module';
import { PayoutMethodsModule } from './payout-methods/payout-methods.module';
import { ConsentsModule } from './consents/consents.module';
import { DomainExceptionFilter } from './shared/infrastructure/filters/domain-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
            validationSchema: envValidationSchema,
            envFilePath: '.env',
        }),

        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const prod = config.get<string>('NODE_ENV') === 'production';
                return {
                    pinoHttp: {
                        level: prod ? 'info' : 'debug',
                        redact: {
                            paths: [
                                'req.headers.authorization',
                                'req.headers.cookie',
                                'req.body.password',
                                'req.body.currentPassword',
                                'req.body.newPassword',
                            ],
                            censor: '[REDACTED]',
                        },
                        autoLogging: {
                            ignore: (req) =>
                                req.url === '/api/health' ||
                                req.url === '/api/docs' ||
                                (req.url ?? '').startsWith('/api/docs/'),
                        },
                        customLogLevel: (_req, res, err) => {
                            if (err || res.statusCode >= 500) return 'error';
                            if (res.statusCode >= 400) return 'warn';
                            return 'info';
                        },
                        transport: prod
                            ? undefined
                            : {
                                  target: 'pino-pretty',
                                  options: {
                                      singleLine: true,
                                      translateTime: 'SYS:HH:MM:ss.l',
                                      ignore: 'pid,hostname,req.headers',
                                  },
                              },
                    },
                };
            },
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('database.host'),
                port: config.get<number>('database.port'),
                username: config.get<string>('database.username'),
                password: config.get<string>('database.password'),
                database: config.get<string>('database.database'),
                synchronize: config.get<boolean>('database.synchronize'),
                logging: config.get<boolean>('database.logging'),
                autoLoadEntities: true,
                migrations: ['dist/database/migrations/*.js'],
            }),
        }),

        ScheduleModule.forRoot(),

        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => [
                {
                    name: 'default',
                    ttl: Number(config.get('THROTTLE_TTL_MS', 60_000)),
                    limit: Number(config.get('THROTTLE_LIMIT', 120)),
                },
            ],
        }),

        SharedModule,
        AuditModule,
        BetterAuthModule,
        UsersModule,
        CompaniesModule,
        VenuesModule,
        CategoriesModule,
        EventsModule,
        TicketsModule,
        PaymentsModule,
        CheckoutModule,
        WalletModule,
        CheckinModule,
        TransferModule,
        PayoutMethodsModule,
        ConsentsModule,
        MarketplaceModule,
        SweepersModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule {}
