import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session, SYSTEM_ROLES, UserSession } from '../../../auth';
import { AdminNotificationService } from '../../application/services/admin-notification.service';

@ApiTags('Admin — Notifications')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/notifications')
export class AdminNotificationsController {
    constructor(private readonly notifications: AdminNotificationService) {}

    @Get()
    list(
        @Query('unackOnly') unackOnly?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notifications.list({
            unackOnly: unackOnly === 'true',
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Patch(':id/ack')
    ack(@Param('id') id: string, @Session() session: UserSession) {
        return this.notifications.acknowledge(id, session.user.id);
    }

    @Post('ack-all')
    async ackAll(@Session() session: UserSession) {
        const count = await this.notifications.acknowledgeAll(session.user.id);
        return { acknowledged: count };
    }
}
