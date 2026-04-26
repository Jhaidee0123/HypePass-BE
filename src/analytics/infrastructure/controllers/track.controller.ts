import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AllowAnonymous } from '../../../auth/decorators/allow-anonymous.decorator';
import { PageViewService } from '../../application/services/page-view.service';
import { TrackPageViewDto } from '../../application/dto/track-page-view.dto';

@ApiTags('Public — Analytics')
@Controller('track')
export class TrackController {
    constructor(private readonly pageViews: PageViewService) {}

    @Post()
    @AllowAnonymous()
    @HttpCode(204)
    async track(@Body() dto: TrackPageViewDto, @Req() req: Request) {
        const session = (req as Request & { session?: { user?: { id: string } } }).session;
        await this.pageViews.track(dto, {
            userId: session?.user?.id ?? null,
            ip: (req.ip ?? null) as string | null,
            userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
        });
    }
}
