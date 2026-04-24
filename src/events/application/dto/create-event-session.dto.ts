import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateEventSessionDto {
    @ApiPropertyOptional({ example: 'Día 1' })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    name?: string;

    @ApiProperty()
    @IsDateString()
    startsAt: string;

    @ApiProperty()
    @IsDateString()
    endsAt: string;

    @ApiProperty({ example: 'America/Bogota', default: 'America/Bogota' })
    @IsString()
    @MaxLength(60)
    timezone: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    salesStartAt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    salesEndAt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    doorsOpenAt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    checkinStartAt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    transferCutoffAt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    resaleCutoffAt?: string;

    @ApiPropertyOptional({
        description:
            'When the QR becomes visible. If null, derived from event.defaultQrVisibleHoursBefore or platform default.',
    })
    @IsOptional()
    @IsDateString()
    qrVisibleFrom?: string;
}
