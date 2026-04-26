import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageViewOrmEntity } from '../../infrastructure/orm/page-view.orm.entity';
import { TrackPageViewDto } from '../dto/track-page-view.dto';

const truncateIp = (ip?: string | null): string | null => {
    if (!ip) return null;
    if (ip.includes(':')) {
        // ipv6 — keep first 4 groups, mask rest
        const parts = ip.split(':');
        return `${parts.slice(0, 4).join(':')}::/64`;
    }
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
};

@Injectable()
export class PageViewService {
    private readonly logger = new Logger(PageViewService.name);

    constructor(
        @InjectRepository(PageViewOrmEntity)
        private readonly repo: Repository<PageViewOrmEntity>,
    ) {}

    async track(
        dto: TrackPageViewDto,
        ctx: { userId: string | null; ip: string | null; userAgent: string | null },
    ): Promise<void> {
        try {
            await this.repo.insert({
                id: randomUUID(),
                path: dto.path.slice(0, 200),
                referrer: dto.referrer ? dto.referrer.slice(0, 200) : null,
                sessionId: dto.sessionId.slice(0, 80),
                userId: ctx.userId,
                ipClass: truncateIp(ctx.ip),
                userAgent: ctx.userAgent ? ctx.userAgent.slice(0, 200) : null,
                locale: dto.locale ?? null,
                device: dto.device ?? null,
            });
        } catch (err: any) {
            this.logger.warn(`page-view track failed: ${err?.message}`);
        }
    }
}
