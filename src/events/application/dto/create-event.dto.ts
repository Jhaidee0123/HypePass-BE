import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateEventDto {
    @ApiProperty({ example: 'PARALLAX — Festival 3 días' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(220)
    title: string;

    @ApiProperty({ example: 'parallax-festival-2026' })
    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'slug must be lowercase alphanumeric words separated by dashes',
    })
    @MaxLength(220)
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    venueId?: string;

    @ApiPropertyOptional({ maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    shortDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    coverImageUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bannerImageUrl?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    resaleEnabled?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    transferEnabled?: boolean;

    @ApiPropertyOptional({
        description:
            'Hours before session.startsAt at which the QR becomes visible. Overrides platform default.',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    defaultQrVisibleHoursBefore?: number;

    @ApiPropertyOptional({ default: 'COP' })
    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;

    @ApiPropertyOptional({
        description:
            'Resale price cap multiplier over face value (e.g. 1.2 = 120%). Null → uses platform default.',
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    resalePriceCapMultiplier?: number | null;

    @ApiPropertyOptional({
        description:
            'Resale platform fee percentage on the ask price. Null → uses platform default.',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(50)
    resaleFeePct?: number | null;

    @ApiPropertyOptional({
        description:
            'Max tickets a single user can hold across primary orders for a given session. Null = no cap.',
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxTicketsPerUserPerSession?: number | null;

    @ApiPropertyOptional({
        description: 'Free-form venue/location name shown on the event page.',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    locationName?: string | null;

    @ApiPropertyOptional({
        description: 'Full street address (kept exactly as the organizer typed/searched it).',
        maxLength: 400,
    })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    locationAddress?: string | null;

    @ApiPropertyOptional({ description: 'WGS84 latitude (-90 to 90).' })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    locationLatitude?: number | null;

    @ApiPropertyOptional({ description: 'WGS84 longitude (-180 to 180).' })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    locationLongitude?: number | null;
}
