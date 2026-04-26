import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '../../../auth/decorators/allow-anonymous.decorator';
import { PlatformSettingsService } from '../../application/services/platform-settings.service';

@ApiTags('Public — Platform')
@Controller('public/platform-status')
export class PublicPlatformStatusController {
    constructor(private readonly settings: PlatformSettingsService) {}

    @Get()
    @AllowAnonymous()
    get() {
        return {
            maintenance: {
                enabled: this.settings.bool('maintenance.enabled'),
                message: this.settings.str('maintenance.message'),
            },
            signupsEnabled: this.settings.bool('signups.enabled', true),
            checkoutEnabled: this.settings.bool('checkout.enabled', true),
            resaleEnabled: this.settings.bool('resale.enabled', true),
        };
    }
}
