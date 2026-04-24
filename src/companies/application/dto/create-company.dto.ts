import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Stage Live Producciones' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(160)
    name: string;

    @ApiProperty({
        example: 'stage-live',
        description: 'URL-safe slug. Lowercase letters, numbers and dashes.',
    })
    @IsString()
    @MinLength(3)
    @MaxLength(160)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'slug must be lowercase alphanumeric words separated by dashes',
    })
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    legalName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(40)
    taxId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    logoUrl?: string;
}
