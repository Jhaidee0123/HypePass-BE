import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Inject,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BETTER_AUTH } from './constants';
import { importEsm } from './esm-loader';
import { ALLOW_ANONYMOUS_KEY } from './decorators/allow-anonymous.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class BetterAuthGuard implements CanActivate {
    private fromNodeHeaders: (headers: any) => Headers;

    constructor(
        @Inject(BETTER_AUTH) private auth: any,
        private reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isAnonymous = this.reflector.getAllAndOverride<boolean>(
            ALLOW_ANONYMOUS_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isAnonymous) return true;

        const request = context.switchToHttp().getRequest<Request>();

        if (!this.fromNodeHeaders) {
            const mod = await importEsm('better-auth/node');
            this.fromNodeHeaders = mod.fromNodeHeaders;
        }

        const session = await this.auth.api.getSession({
            headers: this.fromNodeHeaders(request.headers),
        });

        if (!session) {
            throw new UnauthorizedException();
        }

        (request as any).betterAuthSession = session;

        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (requiredRoles && requiredRoles.length > 0) {
            const userRole = session.user?.role;
            if (
                userRole !== 'platform_admin' &&
                !requiredRoles.includes(userRole)
            ) {
                throw new ForbiddenException('Insufficient role');
            }
        }

        return true;
    }
}
