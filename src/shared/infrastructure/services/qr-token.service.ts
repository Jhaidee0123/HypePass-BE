import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export type QrTokenPayload = {
    /** Ticket id */
    tid: string;
    /** Ticket.qrGenerationVersion at mint time — stale tokens fail. */
    qrv: number;
    /** Ticket.ownershipVersion at mint time — invalidates on transfer/resale. */
    ov: number;
    /** issued-at epoch seconds */
    iat: number;
    /** expires-at epoch seconds */
    exp: number;
};

export type VerifyTokenResult =
    | { ok: true; payload: QrTokenPayload }
    | { ok: false; reason: 'malformed' | 'signature' | 'expired' };

/**
 * Compact HMAC-signed QR token: `<base64url(payload)>.<base64url(sig)>`.
 * Shorter than JWT, same guarantees. Secret must be 16+ chars.
 */
@Injectable()
export class QrTokenService {
    private readonly secret: string;
    private readonly ttlSeconds: number;

    constructor(config: ConfigService) {
        this.secret = config.get<string>('QR_HMAC_SECRET')!;
        this.ttlSeconds = Number(
            config.get<number>('QR_TOKEN_TTL_SECONDS', 60),
        );
    }

    sign(payload: Omit<QrTokenPayload, 'iat' | 'exp'>): {
        token: string;
        payload: QrTokenPayload;
    } {
        const now = Math.floor(Date.now() / 1000);
        const full: QrTokenPayload = {
            ...payload,
            iat: now,
            exp: now + this.ttlSeconds,
        };
        const body = Buffer.from(JSON.stringify(full)).toString('base64url');
        const sig = createHmac('sha256', this.secret)
            .update(body)
            .digest('base64url');
        return { token: `${body}.${sig}`, payload: full };
    }

    verify(token: string): VerifyTokenResult {
        const parts = token.split('.');
        if (parts.length !== 2) return { ok: false, reason: 'malformed' };
        const [body, sig] = parts;
        let payload: QrTokenPayload;
        try {
            payload = JSON.parse(
                Buffer.from(body, 'base64url').toString('utf8'),
            );
        } catch {
            return { ok: false, reason: 'malformed' };
        }
        const expected = createHmac('sha256', this.secret)
            .update(body)
            .digest('base64url');
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return { ok: false, reason: 'signature' };
        }
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp < now) {
            return { ok: false, reason: 'expired' };
        }
        return { ok: true, payload };
    }
}
