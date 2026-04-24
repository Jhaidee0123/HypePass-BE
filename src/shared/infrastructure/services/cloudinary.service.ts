import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export type CloudinaryUploadResult = {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
};

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    private readonly folder: string;

    constructor(private readonly config: ConfigService) {
        cloudinary.config({
            cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
            secure: true,
        });
        this.folder =
            this.config.get<string>('CLOUDINARY_FOLDER') ?? 'hypepass';
    }

    async uploadImage(
        buffer: Buffer,
        originalName: string,
        subfolder = 'events',
    ): Promise<CloudinaryUploadResult> {
        const nameWithoutExt = originalName.replace(/\.[^.]+$/, '');
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const time = now.toISOString().slice(11, 19).replace(/:/g, '');
        const rand = Math.random().toString(36).slice(2, 8);
        const publicId = `${nameWithoutExt}_${date}_${time}_${rand}`;
        const folder = `${this.folder}/${subfolder}`;

        return new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: publicId,
                    resource_type: 'image',
                    overwrite: false,
                },
                (error, result) => {
                    if (error || !result) {
                        this.logger.error(
                            `Cloudinary upload failed: ${error?.message ?? 'unknown'}`,
                        );
                        reject(error ?? new Error('Cloudinary upload failed'));
                        return;
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                    });
                },
            );
            Readable.from(buffer).pipe(stream);
        });
    }

    async deleteImage(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }
}
