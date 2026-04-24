import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TicketsModule } from '../tickets/tickets.module';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { EmailService } from '../shared/infrastructure/services/email.service';
import { user_service_token } from '../users/infrastructure/tokens/users.tokens';
import {
    event_service_token,
    event_session_service_token,
} from '../events/infrastructure/tokens/events.tokens';
import {
    ticket_qr_token_service_token,
    ticket_transfer_service_token,
} from '../tickets/infrastructure/tokens/tickets.tokens';
import { TransferController } from './infrastructure/controllers/transfer.controller';
import {
    list_my_transfers_usecase_token,
    transfer_ticket_usecase_token,
} from './infrastructure/tokens/transfer.tokens';
import { TransferTicketUseCase } from './application/use-case/transfer-ticket.usecase';
import { ListMyTransfersUseCase } from './application/use-case/list-my-transfers.usecase';

@Module({
    imports: [TicketsModule, UsersModule, EventsModule],
    providers: [
        {
            provide: transfer_ticket_usecase_token,
            useFactory: (
                ds: DataSource,
                userSvc,
                eventSvc,
                sessionSvc,
                transferSvc,
                qrSvc,
                email: EmailService,
            ) =>
                new TransferTicketUseCase(
                    ds,
                    userSvc,
                    eventSvc,
                    sessionSvc,
                    transferSvc,
                    qrSvc,
                    email,
                ),
            inject: [
                DataSource,
                user_service_token,
                event_service_token,
                event_session_service_token,
                ticket_transfer_service_token,
                ticket_qr_token_service_token,
                EmailService,
            ],
        },
        {
            provide: list_my_transfers_usecase_token,
            useFactory: (transferSvc) =>
                new ListMyTransfersUseCase(transferSvc),
            inject: [ticket_transfer_service_token],
        },
    ],
    controllers: [TransferController],
})
export class TransferModule {}
