import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackPageViewDto {
    @ApiProperty({ maxLength: 200 })
    @IsString()
    @MaxLength(200)
    path!: string;

    @ApiPropertyOptional({ maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    referrer?: string;

    @ApiProperty({ description: 'Anonymous session id (UUID) generated on the client' })
    @IsString()
    @MaxLength(80)
    sessionId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(8)
    locale?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    device?: string;
}
