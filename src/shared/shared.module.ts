import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './infrastructure/services/cloudinary.service';
import { EmailService } from './infrastructure/services/email.service';
import { QrTokenService } from './infrastructure/services/qr-token.service';
import { CryptoService } from './infrastructure/services/crypto.service';
import { UploadController } from './infrastructure/controllers/upload.controller';

/**
 * Cross-cutting services + controllers used by multiple feature modules.
 * Marked @Global so feature modules don't need to import it explicitly.
 */
@Global()
@Module({
    providers: [
        CloudinaryService,
        EmailService,
        QrTokenService,
        CryptoService,
    ],
    controllers: [UploadController],
    exports: [
        CloudinaryService,
        EmailService,
        QrTokenService,
        CryptoService,
    ],
})
export class SharedModule {}
