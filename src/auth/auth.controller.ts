import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { BETTER_AUTH } from './constants';
import { importEsm } from './esm-loader';
import { AllowAnonymous } from './decorators/allow-anonymous.decorator';

@AllowAnonymous()
@Throttle({
    default: {
        limit: Number(process.env.THROTTLE_AUTH_LIMIT ?? 20),
        ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    },
})
@Controller('auth')
export class BetterAuthController {
    private toNodeHandler: any;

    constructor(@Inject(BETTER_AUTH) private auth: any) {}

    @All('*')
    async handleAuth(@Req() req: Request, @Res() res: Response): Promise<void> {
        if (!this.toNodeHandler) {
            const mod = await importEsm('better-auth/node');
            this.toNodeHandler = mod.toNodeHandler;
        }
        const handler = this.toNodeHandler(this.auth);
        handler(req, res);
    }
}
