import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { firstValueFrom } from 'rxjs';

export type MpOAuthTokenResponse = {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number; // seconds
    scope: string;
    user_id: number;
    public_key: string;
    live_mode: boolean;
};

/**
 * Wraps the MercadoPago OAuth flow:
 *   1. buildAuthorizeUrl — generates the URL we redirect the seller to
 *   2. exchangeCode — swaps the `code` from the callback for an
 *      access_token + refresh_token + the seller's user_id and public_key
 *   3. refresh — exchanges a refresh_token for a fresh access_token when
 *      the 180-day window is about to elapse
 *
 * State is signed with `MERCADOPAGO_STATE_SECRET` (defaults to the
 * `MERCADOPAGO_CLIENT_SECRET`) so the callback can prove the state hasn't
 * been tampered with and ties it to the right `companyId`.
 */
@Injectable()
export class MercadoPagoOAuthService {
    private readonly logger = new Logger(MercadoPagoOAuthService.name);
    private readonly authBaseUrl = 'https://auth.mercadopago.com';
    private readonly tokenUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly stateSecret: string;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
    ) {
        this.tokenUrl = `${this.config.get<string>('MERCADOPAGO_API_URL', 'https://api.mercadopago.com')}/oauth/token`;
        this.clientId = this.config.get<string>('MERCADOPAGO_CLIENT_ID', '');
        this.clientSecret = this.config.get<string>(
            'MERCADOPAGO_CLIENT_SECRET',
            '',
        );
        this.redirectUri = this.config.get<string>(
            'MERCADOPAGO_REDIRECT_URI',
            '',
        );
        this.stateSecret =
            this.config.get<string>('MERCADOPAGO_STATE_SECRET', '') ||
            this.clientSecret;
    }

    /** Build a signed state token tying the OAuth round-trip to a
     *  specific company + nonce. Format: `<companyId>.<nonce>.<sig>` */
    signState(companyId: string): string {
        const nonce = randomBytes(8).toString('hex');
        const sig = createHmac('sha256', this.stateSecret)
            .update(`${companyId}.${nonce}`)
            .digest('hex')
            .slice(0, 32);
        return `${companyId}.${nonce}.${sig}`;
    }

    /** Returns the `companyId` if the state is well-formed and the
     *  HMAC checks out. Throws otherwise. */
    verifyState(state: string): string {
        const parts = state.split('.');
        if (parts.length !== 3) {
            throw new Error('Malformed OAuth state');
        }
        const [companyId, nonce, sig] = parts;
        const expected = createHmac('sha256', this.stateSecret)
            .update(`${companyId}.${nonce}`)
            .digest('hex')
            .slice(0, 32);
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            throw new Error('Invalid OAuth state signature');
        }
        return companyId;
    }

    buildAuthorizeUrl(companyId: string): string {
        const state = this.signState(companyId);
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            platform_id: 'mp',
            state,
            redirect_uri: this.redirectUri,
        });
        return `${this.authBaseUrl}/authorization?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<MpOAuthTokenResponse> {
        const body = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
        };
        const response = await firstValueFrom(
            this.http.post<MpOAuthTokenResponse>(this.tokenUrl, body, {
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        return response.data;
    }

    async refresh(refreshToken: string): Promise<MpOAuthTokenResponse> {
        const body = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        };
        const response = await firstValueFrom(
            this.http.post<MpOAuthTokenResponse>(this.tokenUrl, body, {
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        return response.data;
    }
}
