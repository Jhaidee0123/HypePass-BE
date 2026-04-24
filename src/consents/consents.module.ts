import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserConsentOrmEntity } from './infrastructure/orm/user-consent.orm.entity';
import { UserConsentService } from './application/services/user-consent.service';
import { RecordConsentUseCase } from './application/use-case/record-consent.usecase';
import { ListMyConsentsUseCase } from './application/use-case/list-my-consents.usecase';
import { ProfileConsentsController } from './infrastructure/controllers/profile-consents.controller';
import {
    list_my_consents_use_case_token,
    record_consent_use_case_token,
    user_consent_service_token,
} from './infrastructure/tokens/consents.tokens';

@Module({
    imports: [TypeOrmModule.forFeature([UserConsentOrmEntity])],
    providers: [
        { provide: user_consent_service_token, useClass: UserConsentService },
        {
            provide: record_consent_use_case_token,
            useFactory: (svc) => new RecordConsentUseCase(svc),
            inject: [user_consent_service_token],
        },
        {
            provide: list_my_consents_use_case_token,
            useFactory: (svc) => new ListMyConsentsUseCase(svc),
            inject: [user_consent_service_token],
        },
    ],
    controllers: [ProfileConsentsController],
    exports: [
        user_consent_service_token,
        record_consent_use_case_token,
        TypeOrmModule,
    ],
})
export class ConsentsModule {}
