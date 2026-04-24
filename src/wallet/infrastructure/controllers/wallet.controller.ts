import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import {
    get_my_ticket_usecase_token,
    get_ticket_qr_usecase_token,
    list_my_tickets_usecase_token,
} from '../tokens/wallet.tokens';
import { ListMyTicketsUseCase } from '../../application/use-case/list-my-tickets.usecase';
import { GetMyTicketUseCase } from '../../application/use-case/get-my-ticket.usecase';
import { GetTicketQrUseCase } from '../../application/use-case/get-ticket-qr.usecase';

@ApiTags('Wallet')
@ApiCookieAuth()
@Controller('wallet')
export class WalletController {
    constructor(
        @Inject(list_my_tickets_usecase_token)
        private readonly listMine: ListMyTicketsUseCase,
        @Inject(get_my_ticket_usecase_token)
        private readonly getMine: GetMyTicketUseCase,
        @Inject(get_ticket_qr_usecase_token)
        private readonly getQr: GetTicketQrUseCase,
    ) {}

    @Get('tickets')
    list(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }

    @Get('tickets/:ticketId')
    get(
        @Session() session: UserSession,
        @Param('ticketId') ticketId: string,
    ) {
        return this.getMine.execute(session.user.id, ticketId);
    }

    @Get('tickets/:ticketId/qr')
    qr(@Session() session: UserSession, @Param('ticketId') ticketId: string) {
        return this.getQr.execute(session.user.id, ticketId);
    }
}
