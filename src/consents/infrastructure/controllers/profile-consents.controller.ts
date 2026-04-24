import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Session } from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import { RecordConsentDto } from '../../application/dto/record-consent.dto';
import {
    list_my_consents_use_case_token,
    record_consent_use_case_token,
} from '../tokens/consents.tokens';
import { RecordConsentUseCase } from '../../application/use-case/record-consent.usecase';
import { ListMyConsentsUseCase } from '../../application/use-case/list-my-consents.usecase';

@ApiTags('Profile · Consents')
@ApiCookieAuth()
@Controller('profile/consents')
export class ProfileConsentsController {
    constructor(
        @Inject(record_consent_use_case_token)
        private readonly record: RecordConsentUseCase,
        @Inject(list_my_consents_use_case_token)
        private readonly listMine: ListMyConsentsUseCase,
    ) {}

    @Get()
    list(@Session() session: UserSession) {
        return this.listMine.execute(session.user.id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Session() session: UserSession,
        @Body() dto: RecordConsentDto,
        @Req() req: Request,
    ) {
        return this.record.execute({
            userId: session.user.id,
            termsVersion: dto.termsVersion,
            privacyVersion: dto.privacyVersion,
            source: 'signup',
            ipAddress: extractIp(req),
            userAgent:
                (req.headers['user-agent'] as string | undefined)?.slice(
                    0,
                    300,
                ) ?? null,
        });
    }
}

function extractIp(req: Request): string | null {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
        return xff.split(',')[0].trim().slice(0, 64);
    }
    return (req.ip ?? null)?.slice(0, 64) ?? null;
}
