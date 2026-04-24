import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(PinoLogger));
    const logger = new Logger('Bootstrap');

    app.setGlobalPrefix('api');

    const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:8090')
        .split(',')
        .map((o) => o.trim());

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    const swaggerConfig = new DocumentBuilder()
        .setTitle('HypePass API')
        .setDescription(
            'Multi-tenant ticketing platform — events, tickets, resale, check-in.',
        )
        .setVersion('0.1.0')
        .addCookieAuth('better-auth.session_token')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`HypePass API running on port ${port}`);
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
