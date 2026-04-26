import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, Session, SYSTEM_ROLES, UserSession } from '../../../auth';
import { PlatformSettingsService } from '../../application/services/platform-settings.service';
import { PlatformSettingKey } from '../../domain/types/platform-setting.types';
import { UpdatePlatformSettingDto } from '../../application/dto/update-platform-setting.dto';

@ApiTags('Admin — Platform settings')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/platform-settings')
export class AdminPlatformSettingsController {
    constructor(private readonly settings: PlatformSettingsService) {}

    @Get()
    list() {
        return this.settings.list();
    }

    @Patch(':key')
    update(
        @Param('key') key: PlatformSettingKey,
        @Body() body: UpdatePlatformSettingDto,
        @Session() session: UserSession,
    ) {
        return this.settings.update(key, body.value, session.user.id);
    }
}
