import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsModule } from '../tickets/tickets.module';
import { EventsModule } from '../events/events.module';
import { VenuesModule } from '../venues/venues.module';
import { QrTokenService } from '../shared/infrastructure/services/qr-token.service';
import {
    event_service_token,
    event_session_service_token,
    ticket_section_service_token,
} from '../events/infrastructure/tokens/events.tokens';
import { venue_service_token } from '../venues/infrastructure/tokens/venues.tokens';
import {
    checkin_service_token,
    ticket_qr_token_service_token,
    ticket_service_token,
} from '../tickets/infrastructure/tokens/tickets.tokens';
import { WalletController } from './infrastructure/controllers/wallet.controller';
import {
    get_my_ticket_usecase_token,
    get_ticket_qr_usecase_token,
    list_my_tickets_usecase_token,
} from './infrastructure/tokens/wallet.tokens';
import { ListMyTicketsUseCase } from './application/use-case/list-my-tickets.usecase';
import { GetMyTicketUseCase } from './application/use-case/get-my-ticket.usecase';
import { GetTicketQrUseCase } from './application/use-case/get-ticket-qr.usecase';

@Module({
    imports: [TicketsModule, EventsModule, VenuesModule],
    providers: [
        {
            provide: list_my_tickets_usecase_token,
            useFactory: (
                ticket,
                event,
                ses,
                sec,
                venue,
                checkin,
                config: ConfigService,
            ) =>
                new ListMyTicketsUseCase(
                    ticket,
                    event,
                    ses,
                    sec,
                    venue,
                    checkin,
                    Number(
                        config.get<number>(
                            'DEFAULT_QR_VISIBLE_HOURS_BEFORE',
                            24,
                        ),
                    ),
                ),
            inject: [
                ticket_service_token,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                venue_service_token,
                checkin_service_token,
                ConfigService,
            ],
        },
        {
            provide: get_my_ticket_usecase_token,
            useFactory: (
                ticket,
                event,
                ses,
                sec,
                venue,
                checkin,
                config: ConfigService,
            ) =>
                new GetMyTicketUseCase(
                    ticket,
                    event,
                    ses,
                    sec,
                    venue,
                    checkin,
                    Number(
                        config.get<number>(
                            'DEFAULT_QR_VISIBLE_HOURS_BEFORE',
                            24,
                        ),
                    ),
                ),
            inject: [
                ticket_service_token,
                event_service_token,
                event_session_service_token,
                ticket_section_service_token,
                venue_service_token,
                checkin_service_token,
                ConfigService,
            ],
        },
        {
            provide: get_ticket_qr_usecase_token,
            useFactory: (
                ticket,
                qrToken,
                event,
                ses,
                tokens: QrTokenService,
                config: ConfigService,
            ) =>
                new GetTicketQrUseCase(
                    ticket,
                    qrToken,
                    event,
                    ses,
                    tokens,
                    Number(
                        config.get<number>(
                            'DEFAULT_QR_VISIBLE_HOURS_BEFORE',
                            24,
                        ),
                    ),
                ),
            inject: [
                ticket_service_token,
                ticket_qr_token_service_token,
                event_service_token,
                event_session_service_token,
                QrTokenService,
                ConfigService,
            ],
        },
    ],
    controllers: [WalletController],
})
export class WalletModule {}
