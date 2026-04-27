/**
 * One-shot script to upload the HypePass logo to Cloudinary at a stable
 * path so the email template can reference it via EMAIL_LOGO_URL.
 *
 * Usage:
 *   yarn email:upload-logo
 *
 * The script is idempotent — re-running overwrites the same public_id, so
 * the URL stays stable even if you swap the source image. Prints the
 * delivery URL (with `f_auto,q_auto,w_280,c_limit` transformations baked
 * in) ready to drop into your .env.
 */
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SOURCE_PATH = resolve(
    __dirname,
    '../../HypePass-FE/public/main-logo-transparent.png',
);
const SUBFOLDER = 'branding/email';
const PUBLIC_ID_BASE = 'logo-white-transparent';

async function main() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const baseFolder = process.env.CLOUDINARY_FOLDER ?? 'hypepass';

    if (!cloudName || !apiKey || !apiSecret) {
        console.error(
            '[upload-email-logo] Missing CLOUDINARY_* env vars. Aborting.',
        );
        process.exit(1);
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    let buffer: Buffer;
    try {
        buffer = readFileSync(SOURCE_PATH);
    } catch (err: any) {
        console.error(
            `[upload-email-logo] Could not read ${SOURCE_PATH}: ${err?.message}`,
        );
        process.exit(1);
    }

    const folder = `${baseFolder}/${SUBFOLDER}`;
    console.log(
        `[upload-email-logo] Uploading ${SOURCE_PATH} (${buffer.length} bytes) to ${folder}/${PUBLIC_ID_BASE}…`,
    );

    const result = await new Promise<{
        secure_url: string;
        public_id: string;
        width?: number;
        height?: number;
        bytes?: number;
    }>((resolveUpload, rejectUpload) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: PUBLIC_ID_BASE,
                resource_type: 'image',
                overwrite: true,
                invalidate: true,
            },
            (error, res) => {
                if (error || !res) {
                    rejectUpload(error ?? new Error('No result from Cloudinary'));
                    return;
                }
                resolveUpload(res as any);
            },
        );
        stream.end(buffer);
    });

    // Build a delivery URL with on-the-fly transformations for emails.
    // Width 280px (covers retina 2× of the 140px display size in the
    // template), f_auto + q_auto for modern format/compression.
    const deliveryUrl = cloudinary.url(result.public_id, {
        secure: true,
        transformation: [
            { width: 280, crop: 'limit' },
            { fetch_format: 'auto', quality: 'auto' },
        ],
    });

    console.log('\n✅ Upload OK\n');
    console.log(`  public_id: ${result.public_id}`);
    console.log(
        `  size:      ${result.width ?? '?'}×${result.height ?? '?'} (${result.bytes ?? '?'} bytes)`,
    );
    console.log(`  raw URL:   ${result.secure_url}`);
    console.log(`\n📋 Add this to your BE .env (production + dev):\n`);
    console.log(`EMAIL_LOGO_URL=${deliveryUrl}\n`);
}

main().catch((err) => {
    console.error(`[upload-email-logo] Failed:`, err);
    process.exit(1);
});
