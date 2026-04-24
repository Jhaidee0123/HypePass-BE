import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateTicketSalePhaseDto {
    @ApiProperty({ example: 'PREVENTA' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @ApiProperty()
    @IsDateString()
    startsAt: string;

    @ApiProperty()
    @IsDateString()
    endsAt: string;

    @ApiProperty({
        description: 'Price in minor units (COP cents). e.g. 5000000 = $50.000 COP.',
        example: 5000000,
    })
    @IsInt()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ default: 'COP' })
    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;

    @ApiPropertyOptional({ description: 'Service fee in minor units.' })
    @IsOptional()
    @IsInt()
    @Min(0)
    serviceFee?: number;

    @ApiPropertyOptional({ description: 'Platform fee override in minor units.' })
    @IsOptional()
    @IsInt()
    @Min(0)
    platformFee?: number;

    @ApiPropertyOptional({ description: 'Tax in minor units.' })
    @IsOptional()
    @IsInt()
    @Min(0)
    taxAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    maxPerOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    maxPerUser?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
