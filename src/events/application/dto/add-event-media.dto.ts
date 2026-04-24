import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { EventMediaType } from '../../domain/types/event-media-type';

export class AddEventMediaDto {
    @ApiProperty({ example: 'https://res.cloudinary.com/.../image.jpg' })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiPropertyOptional({ description: 'Cloudinary public id (for deletion).' })
    @IsOptional()
    @IsString()
    publicId?: string;

    @ApiProperty({ enum: EventMediaType })
    @IsEnum(EventMediaType)
    type: EventMediaType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    alt?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
