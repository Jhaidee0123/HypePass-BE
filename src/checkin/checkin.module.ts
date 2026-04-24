import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsModule } from '../tickets/tickets.module';
import { EventsModule } from '../events/events.module';
import { CompaniesModule } from '../companies/companies.module';
import { QrTokenService } from '../shared/infrastructure/services/qr-token.service';
import {
    event_service_token,
    event_session_service_token,
    event_staff_service_token,
} from '../events/infrastructure/tokens/events.tokens';
import { company_membership_service_token } from '../companies/infrastructure/tokens/companies.tokens';
import {
    checkin_service_token,
    ticket_service_token,
} from '../tickets/infrastructure/tokens/tickets.tokens';
import { CheckinController } from './infrastructure/controllers/checkin.controller';
import { scan_ticket_usecase_token } from './infrastructure/tokens/checkin.tokens';
import { ScanTicketUseCase } from './application/use-case/scan-ticket.usecase';

@Module({
    imports: [TicketsModule, EventsModule, CompaniesModule],
    providers: [
        {
            provide: scan_ticket_usecase_token,
            useFactory: (
                ticket,
                checkin,
                event,
                ses,
                membership,
                staff,
                tokens: QrTokenService,
                config: ConfigService,
            ) =>
                new ScanTicketUseCase(
                    ticket,
                    checkin,
                    event,
                    ses,
                    membership,
                    staff,
                    tokens,
                    {
                        platformDefaultHoursBefore: Number(
                            config.get<number>(
                                'DEFAULT_QR_VISIBLE_HOURS_BEFORE',
                                24,
                            ),
                        ),
                        graceMinutes: Number(
                            config.get<number>('CHECKIN_GRACE_MINUTES', 120),
                        ),
                    },
                ),
            inject: [
                ticket_service_token,
                checkin_service_token,
                event_service_token,
                event_session_service_token,
                company_membership_service_token,
                event_staff_service_token,
                QrTokenService,
                ConfigService,
            ],
        },
    ],
    controllers: [CheckinController],
})
export class CheckinModule {}
