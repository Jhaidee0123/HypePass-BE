import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

export type PublicEventSort =
    | 'soonest'
    | 'newest'
    | 'priceAsc'
    | 'priceDesc';

export class PublicEventQueryDto {
    @ApiPropertyOptional({ description: 'Filter by city (case-insensitive).' })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    city?: string;

    @ApiPropertyOptional({ description: 'Filter by category slug or id.' })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    category?: string;

    @ApiPropertyOptional({ description: 'Filter by company id.' })
    @IsOptional()
    @IsString()
    companyId?: string;

    @ApiPropertyOptional({ description: 'Free-text search over title.' })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    search?: string;

    @ApiPropertyOptional({ description: 'ISO date — only events with a session starting on or after.' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'ISO date — only events with a session starting on or before.' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({ description: 'Minimum price (COP cents) based on cheapest upcoming phase.' })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
    @IsInt()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Maximum price (COP cents).' })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
    @IsInt()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Only return events that have at least one active sale phase right now.' })
    @IsOptional()
    @Transform(({ value }) =>
        value === 'true' ? true : value === 'false' ? false : undefined,
    )
    @IsBoolean()
    onSale?: boolean;

    @ApiPropertyOptional({
        enum: ['soonest', 'newest', 'priceAsc', 'priceDesc'],
        default: 'soonest',
    })
    @IsOptional()
    @IsIn(['soonest', 'newest', 'priceAsc', 'priceDesc'])
    sort?: PublicEventSort;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 24 })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? 24 : Number(value)))
    @IsInt()
    @Min(1)
    pageSize?: number;
}
