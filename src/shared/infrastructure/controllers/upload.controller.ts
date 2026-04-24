import {
    BadRequestException,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiConsumes,
    ApiCookieAuth,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../services/cloudinary.service';

@ApiTags('Upload')
@ApiCookieAuth()
@Controller('upload')
export class UploadController {
    constructor(private readonly cloudinary: CloudinaryService) {}

    @Post('image')
    @ApiOperation({
        summary:
            'Upload a single image (event cover/banner/gallery) to Cloudinary',
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif|avif)$/)) {
                    cb(
                        new BadRequestException(
                            'Only images are allowed (jpeg, png, webp, gif, avif)',
                        ),
                        false,
                    );
                    return;
                }
                cb(null, true);
            },
            limits: { fileSize: 8 * 1024 * 1024 },
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        const result = await this.cloudinary.uploadImage(
            file.buffer,
            file.originalname,
        );
        return {
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format,
        };
    }
}
