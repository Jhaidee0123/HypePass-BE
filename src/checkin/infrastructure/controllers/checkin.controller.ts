import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import { ScanTicketDto } from '../../application/dto/scan-ticket.dto';
import { scan_ticket_usecase_token } from '../tokens/checkin.tokens';
import { ScanTicketUseCase } from '../../application/use-case/scan-ticket.usecase';

@ApiTags('Checkin')
@ApiCookieAuth()
@Controller('checkin')
export class CheckinController {
    constructor(
        @Inject(scan_ticket_usecase_token)
        private readonly scanTicket: ScanTicketUseCase,
    ) {}

    @Post('scan')
    scan(@Session() session: UserSession, @Body() dto: ScanTicketDto) {
        return this.scanTicket.execute(session, dto);
    }
}
