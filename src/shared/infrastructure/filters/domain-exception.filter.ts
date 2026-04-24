import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DomainException } from './domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(DomainExceptionFilter.name);

    catch(exception: DomainException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if (exception.statusCode >= 500) {
            this.logger.error(
                `${request.method} ${request.url} → ${exception.name}: ${exception.message}`,
                exception.stack,
            );
        }

        response.status(exception.statusCode).json({
            statusCode: exception.statusCode,
            error: exception.name,
            errorCode: exception.errorCode,
            message: exception.message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
