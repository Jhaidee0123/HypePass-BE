import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AllowAnonymous } from '../../../auth/decorators/allow-anonymous.decorator';
import { SupportService } from '../../application/services/support.service';
import { CreateSupportTicketDto } from '../../application/dto/create-support-ticket.dto';
import { AdminNotificationService } from '../../../admin-notifications/application/services/admin-notification.service';
import { UnprocessableDomainException } from '../../../shared/infrastructure/filters/domain.exception';

@ApiTags('Public — Support')
@Controller('support/tickets')
export class SupportController {
    constructor(
        private readonly support: SupportService,
        private readonly notifications: AdminNotificationService,
    ) {}

    @Post()
    @AllowAnonymous()
    async create(@Body() dto: CreateSupportTicketDto, @Req() req: Request) {
        const session = (
            req as Request & { session?: { user?: { id: string; email?: string } } }
        ).session;
        const userId = session?.user?.id ?? null;
        if (!userId && !dto.guestEmail) {
            throw new UnprocessableDomainException(
                'guestEmail is required when not authenticated',
            );
        }
        const ticket = await this.support.create({
            kind: dto.kind,
            subject: dto.subject,
            body: dto.body,
            userId,
            guestEmail: userId ? null : (dto.guestEmail ?? null),
            relatedOrderId: dto.relatedOrderId ?? null,
            relatedCompanyId: dto.relatedCompanyId ?? null,
            relatedEventId: dto.relatedEventId ?? null,
            attachments: dto.attachments ?? null,
        });
        void this.notifications.record({
            kind:
                dto.kind === 'kyc'
                    ? 'support.kyc'
                    : dto.kind === 'dispute'
                      ? 'support.dispute'
                      : 'support.opened',
            level: dto.kind === 'dispute' ? 'warn' : 'info',
            title: `[${dto.kind}] ${ticket.subject}`,
            body: ticket.body.slice(0, 240),
            metadata: {
                ticketId: ticket.id,
                kind: dto.kind,
                userId,
                guestEmail: ticket.guestEmail,
            },
        });
        return ticket;
    }
}
