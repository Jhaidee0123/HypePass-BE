import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from 'crypto';

/**
 * Symmetric encryption for at-rest secrets we have to keep around (e.g.
 * MercadoPago seller access_tokens that have a 6-month lifespan and need
 * to be presented to MP at checkout time).
 *
 * Uses AES-256-GCM with a per-record random IV. The ciphertext format is
 *   v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>
 * so we can rotate algorithms in the future by checking the version
 * prefix.
 *
 * The key is derived once via scrypt from `PAYMENT_CRED_ENCRYPTION_KEY`
 * (32 bytes after derivation). Generate a fresh key in dev with:
 *   openssl rand -base64 32
 */
@Injectable()
export class CryptoService {
    private readonly logger = new Logger(CryptoService.name);
    private readonly key: Buffer | null;

    constructor(config: ConfigService) {
        const raw = config.get<string>('PAYMENT_CRED_ENCRYPTION_KEY', '');
        if (!raw) {
            this.logger.warn(
                'PAYMENT_CRED_ENCRYPTION_KEY is not set — encryption is DISABLED. ' +
                    'Set it in .env to enable storing 3rd-party credentials.',
            );
            this.key = null;
            return;
        }
        // Salt is constant on purpose — we want stable derivation across
        // restarts. Rotating the key requires re-encrypting the DB.
        this.key = scryptSync(raw, 'hypepass-cred-salt', 32);
    }

    encrypt(plain: string): string {
        if (!this.key) {
            throw new Error(
                'CryptoService.encrypt called but no key is configured',
            );
        }
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.key, iv);
        const enc = Buffer.concat([
            cipher.update(plain, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
    }

    decrypt(payload: string): string {
        if (!this.key) {
            throw new Error(
                'CryptoService.decrypt called but no key is configured',
            );
        }
        const parts = payload.split(':');
        if (parts.length !== 4 || parts[0] !== 'v1') {
            throw new Error('Unsupported ciphertext format');
        }
        const iv = Buffer.from(parts[1], 'hex');
        const tag = Buffer.from(parts[2], 'hex');
        const enc = Buffer.from(parts[3], 'hex');
        const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([
            decipher.update(enc),
            decipher.final(),
        ]);
        return dec.toString('utf8');
    }

    /** Helper: returns null if input is null/empty, else encrypts. */
    encryptOrNull(plain: string | null | undefined): string | null {
        if (!plain) return null;
        return this.encrypt(plain);
    }

    /** Helper: returns null if input is null/empty, else decrypts. */
    decryptOrNull(payload: string | null | undefined): string | null {
        if (!payload) return null;
        try {
            return this.decrypt(payload);
        } catch (err: any) {
            this.logger.error(
                `Failed to decrypt credential: ${err?.message ?? 'unknown'}`,
            );
            return null;
        }
    }
}
