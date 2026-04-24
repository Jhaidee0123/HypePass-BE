import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrmEntity } from './infrastructure/orm/payment.orm.entity';
import { PaymentWebhookEventOrmEntity } from './infrastructure/orm/payment-webhook-event.orm.entity';
import { PaymentService } from './application/services/payment.service';
import { PaymentWebhookEventService } from './application/services/payment-webhook-event.service';
import { WompiService } from './infrastructure/services/wompi.service';
import {
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
        ]),
    ],
    providers: [
        WompiService,
        { provide: payment_gateway_token, useExisting: WompiService },
        { provide: payment_service_token, useClass: PaymentService },
        {
            provide: payment_webhook_event_service_token,
            useClass: PaymentWebhookEventService,
        },
    ],
    exports: [
        payment_gateway_token,
        payment_service_token,
        payment_webhook_event_service_token,
        WompiService,
    ],
})
export class PaymentsModule {}
