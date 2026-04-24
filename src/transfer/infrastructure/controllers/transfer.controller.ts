import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import { TransferTicketDto } from '../../application/dto/transfer-ticket.dto';
import {
    list_my_transfers_usecase_token,
    transfer_ticket_usecase_token,
} from '../tokens/transfer.tokens';
import { TransferTicketUseCase } from '../../application/use-case/transfer-ticket.usecase';
import { ListMyTransfersUseCase } from '../../application/use-case/list-my-transfers.usecase';

@ApiTags('Wallet — Transfers')
@ApiCookieAuth()
@Controller('wallet')
export class TransferController {
    constructor(
        @Inject(transfer_ticket_usecase_token)
        private readonly transferTicket: TransferTicketUseCase,
        @Inject(list_my_transfers_usecase_token)
        private readonly listMine: ListMyTransfersUseCase,
    ) {}

    @Post('tickets/:ticketId/transfer')
    @HttpCode(HttpStatus.OK)
    transfer(
        @Session() session: UserSession,
        @Param('ticketId') ticketId: string,
        @Body() dto: TransferTicketDto,
    ) {
        return this.transferTicket.execute(session.user.id, ticketId, dto);
    }

    @Get('transfers')
    list(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }
}
