import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session, SYSTEM_ROLES, UserSession } from '../../../auth';
import { SupportService } from '../../application/services/support.service';
import {
    ReplySupportTicketDto,
    UpdateSupportStatusDto,
} from '../../application/dto/create-support-ticket.dto';
import {
    SupportTicketKind,
    SupportTicketStatus,
} from '../../domain/types/support.types';

@ApiTags('Admin — Support')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/support/tickets')
export class AdminSupportController {
    constructor(private readonly support: SupportService) {}

    @Get()
    list(
        @Query('kind') kind?: SupportTicketKind,
        @Query('status') status?: SupportTicketStatus,
        @Query('q') q?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.support.list({
            kind,
            status,
            q,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Get(':id')
    detail(@Param('id') id: string) {
        return this.support.getDetail(id);
    }

    @Post(':id/reply')
    reply(
        @Param('id') id: string,
        @Body() dto: ReplySupportTicketDto,
        @Session() session: UserSession,
    ) {
        return this.support.reply(id, dto.body, dto.attachments ?? null, {
            kind: 'admin',
            userId: session.user.id,
        });
    }

    @Patch(':id/status')
    status(
        @Param('id') id: string,
        @Body() dto: UpdateSupportStatusDto,
        @Session() session: UserSession,
    ) {
        return this.support.setStatus(id, dto.status, session.user.id);
    }
}
