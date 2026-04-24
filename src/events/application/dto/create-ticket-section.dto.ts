import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateTicketSectionDto {
    @ApiProperty({ example: 'VIP' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 500, description: 'Total capacity for this section in this session.' })
    @IsInt()
    @Min(1)
    totalInventory: number;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    minPerOrder?: number;

    @ApiPropertyOptional({ default: 8 })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxPerOrder?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    resaleAllowed?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    transferAllowed?: boolean;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
