import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles, SYSTEM_ROLES } from '../../../auth';
import { GetAnalyticsUseCase } from '../../application/use-case/get-analytics.usecase';

@ApiTags('Admin — Analytics')
@ApiCookieAuth()
@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])
@Controller('admin/analytics')
export class AdminAnalyticsController {
    constructor(private readonly getAnalytics: GetAnalyticsUseCase) {}

    @Get()
    get(@Query('days') days?: string) {
        const d = days ? Number(days) : 30;
        return this.getAnalytics.execute(Number.isFinite(d) ? d : 30);
    }
}
