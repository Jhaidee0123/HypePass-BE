import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
} from 'class-validator';

export class UpsertCategoryDto {
    @ApiProperty({ example: 'Concierto' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @ApiProperty({ example: 'concierto' })
    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'slug must be lowercase alphanumeric words separated by dashes',
    })
    @MaxLength(120)
    slug: string;

    @ApiPropertyOptional({ example: '🎤' })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    icon?: string;

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
