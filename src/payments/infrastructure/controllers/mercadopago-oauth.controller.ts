import {
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
    AllowAnonymous,
    CompanyRoles,
    Session,
} from '../../../auth/decorators';
import { COMPANY_ROLES, UserSession } from '../../../auth';
import { MercadoPagoOAuthService } from '../../application/services/mercadopago-oauth.service';
import { TenantGuard } from '../../../companies/infrastructure/guards/tenant.guard';
import {
    list_company_payment_gateways_usecase_token,
    mp_connect_usecase_token,
    mp_disconnect_usecase_token,
} from '../tokens/payments.tokens';
import { MpConnectUseCase } from '../../application/use-case/mp-connect.usecase';
import { MpDisconnectUseCase } from '../../application/use-case/mp-disconnect.usecase';
import { ListCompanyPaymentGatewaysUseCase } from '../../application/use-case/list-company-payment-gateways.usecase';
import { ConfigService } from '@nestjs/config';

/**
 * MercadoPago OAuth + per-company gateway status.
 *
 * Endpoints:
 *   - GET   /companies/:companyId/payments/gateways          → status of every gateway
 *   - GET   /companies/:companyId/payments/mp/authorize      → 302 to MP authorize URL
 *   - GET   /payments/mp/callback?code&state                 → public, MP redirects here
 *   - DELETE /companies/:companyId/payments/mp               → disconnect
 *
 * The callback is the only endpoint that's @AllowAnonymous because the
 * MP authorization server hits it without our session cookies.
 */
@ApiTags('Payments · Gateways')
@ApiCookieAuth()
@Controller()
export class MercadoPagoOAuthController {
    constructor(
        private readonly oauth: MercadoPagoOAuthService,
        private readonly config: ConfigService,
        @Inject(mp_connect_usecase_token)
        private readonly connect: MpConnectUseCase,
        @Inject(mp_disconnect_usecase_token)
        private readonly disconnect: MpDisconnectUseCase,
        @Inject(list_company_payment_gateways_usecase_token)
        private readonly listStatuses: ListCompanyPaymentGatewaysUseCase,
    ) {}

    @Get('companies/:companyId/payments/gateways')
    @UseGuards(TenantGuard)
    @CompanyRoles([
        COMPANY_ROLES.OWNER,
        COMPANY_ROLES.ADMIN,
        COMPANY_ROLES.VIEWER,
    ])
    listGateways(@Param('companyId') companyId: string) {
        return this.listStatuses.execute(companyId);
    }

    @Get('companies/:companyId/payments/mp/authorize')
    @UseGuards(TenantGuard)
    @CompanyRoles([COMPANY_ROLES.OWNER])
    authorize(
        @Param('companyId') companyId: string,
        @Res() res: Response,
    ) {
        const url = this.oauth.buildAuthorizeUrl(companyId);
        return res.redirect(url);
    }

    @Get('payments/mp/callback')
    @AllowAnonymous()
    async callback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Query('error') errorCode: string | undefined,
        @Res() res: Response,
    ) {
        const appUrl = this.config.get<string>('APP_URL', '');
        if (errorCode) {
            return res.redirect(
                `${appUrl}/organizer?mp_error=${encodeURIComponent(errorCode)}`,
            );
        }
        if (!code || !state) {
            return res.redirect(`${appUrl}/organizer?mp_error=missing_params`);
        }
        try {
            // For the callback we don't have a Nest session (MP redirects
            // directly), so we attribute the action to "system" and rely
            // on the signed `state` token to bind the result to the
            // right company.
            const { companyId } = await this.connect.execute(
                code,
                state,
                'system',
            );
            return res.redirect(
                `${appUrl}/organizer/companies/${companyId}/payments?mp_connected=1`,
            );
        } catch (err: any) {
            return res.redirect(
                `${appUrl}/organizer?mp_error=${encodeURIComponent(err?.message ?? 'oauth_failed')}`,
            );
        }
    }

    @Post('companies/:companyId/payments/mp/disconnect')
    @UseGuards(TenantGuard)
    @CompanyRoles([COMPANY_ROLES.OWNER])
    async disconnectMp(
        @Param('companyId') companyId: string,
        @Session() session: UserSession,
    ): Promise<{ ok: true }> {
        await this.disconnect.execute(companyId, session.user.id);
        return { ok: true };
    }
}
