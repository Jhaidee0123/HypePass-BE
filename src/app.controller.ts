import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from './auth/decorators/allow-anonymous.decorator';
import { AppService } from './app.service';

@ApiTags('Health')
@AllowAnonymous()
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('health')
    health() {
        return this.appService.health();
    }
}
