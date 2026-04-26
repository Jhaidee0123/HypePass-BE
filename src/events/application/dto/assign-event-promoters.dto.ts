import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';

class AssignPromoterRecipientDto {
    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty({ minLength: 2, maxLength: 120 })
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    fullName!: string;

    @ApiPropertyOptional({ maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    note?: string;
}

export class AssignEventPromotersDto {
    @ApiProperty({ type: [AssignPromoterRecipientDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => AssignPromoterRecipientDto)
    recipients!: AssignPromoterRecipientDto[];
}

export type AssignPromoterRecipient = AssignPromoterRecipientDto;
