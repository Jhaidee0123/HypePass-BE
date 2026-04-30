import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { PayoutMethodOrmEntity } from './infrastructure/orm/payout-method.orm.entity';
import { PayoutMethodService } from './application/services/payout-method.service';
import {
    create_payout_method_usecase_token,
    delete_payout_method_usecase_token,
    list_my_payout_methods_usecase_token,
    make_default_payout_method_usecase_token,
    payout_method_service_token,
    update_payout_method_usecase_token,
} from './infrastructure/tokens/payout-methods.tokens';
import { ListMyPayoutMethodsUseCase } from './application/use-case/list-my-payout-methods.usecase';
import { CreatePayoutMethodUseCase } from './application/use-case/create-payout-method.usecase';
import { UpdatePayoutMethodUseCase } from './application/use-case/update-payout-method.usecase';
import { DeletePayoutMethodUseCase } from './application/use-case/delete-payout-method.usecase';
import { MakeDefaultPayoutMethodUseCase } from './application/use-case/make-default-payout-method.usecase';
import { ProfilePayoutMethodsController } from './infrastructure/controllers/profile-payout-methods.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([PayoutMethodOrmEntity]),
        PaymentsModule,
    ],
    providers: [
        { provide: payout_method_service_token, useClass: PayoutMethodService },
        {
            provide: list_my_payout_methods_usecase_token,
            useFactory: (svc) => new ListMyPayoutMethodsUseCase(svc),
            inject: [payout_method_service_token],
        },
        {
            provide: create_payout_method_usecase_token,
            useFactory: (svc) => new CreatePayoutMethodUseCase(svc),
            inject: [payout_method_service_token],
        },
        {
            provide: update_payout_method_usecase_token,
            useFactory: (svc) => new UpdatePayoutMethodUseCase(svc),
            inject: [payout_method_service_token],
        },
        {
            provide: delete_payout_method_usecase_token,
            useFactory: (svc) => new DeletePayoutMethodUseCase(svc),
            inject: [payout_method_service_token],
        },
        {
            provide: make_default_payout_method_usecase_token,
            useFactory: (svc) => new MakeDefaultPayoutMethodUseCase(svc),
            inject: [payout_method_service_token],
        },
    ],
    controllers: [ProfilePayoutMethodsController],
    exports: [payout_method_service_token, TypeOrmModule],
})
export class PayoutMethodsModule {}
