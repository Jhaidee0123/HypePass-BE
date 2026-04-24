import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

/** Version format enforced by the client: YYYY-MM-v<N>, e.g. 2026-04-v1. */
const VERSION_REGEX = /^\d{4}-\d{2}-v\d+$/;

export class RecordConsentDto {
    @ApiProperty({ example: '2026-04-v1' })
    @IsString()
    @MaxLength(30)
    @Matches(VERSION_REGEX, {
        message: 'termsVersion must match YYYY-MM-vN',
    })
    termsVersion: string;

    @ApiProperty({ example: '2026-04-v1' })
    @IsString()
    @MaxLength(30)
    @Matches(VERSION_REGEX, {
        message: 'privacyVersion must match YYYY-MM-vN',
    })
    privacyVersion: string;
}
