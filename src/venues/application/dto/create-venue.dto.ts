import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Min,
    MaxLength,
} from 'class-validator';

export class CreateVenueDto {
    @ApiProperty({ example: 'Teatro Mayor Julio Mario Santo Domingo' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @ApiProperty({ example: 'Av. Calle 170 # 67-51' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    addressLine: string;

    @ApiProperty({ example: 'Bogotá' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    city: string;

    @ApiPropertyOptional({ example: 'Cundinamarca' })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    region?: string;

    @ApiProperty({ example: 'CO', default: 'CO' })
    @IsString()
    @Length(2, 3)
    country: string;

    @ApiPropertyOptional({ example: 4.7110 })
    @IsOptional()
    @IsLatitude()
    latitude?: number;

    @ApiPropertyOptional({ example: -74.0721 })
    @IsOptional()
    @IsLongitude()
    longitude?: number;

    @ApiPropertyOptional({ example: 1600 })
    @IsOptional()
    @IsInt()
    @Min(0)
    capacity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    imageUrl?: string;
}
