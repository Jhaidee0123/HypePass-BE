import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateResaleListingDto {
    @ApiProperty({ example: 19000000, required: false })
    @IsOptional()
    @IsInt()
    @Min(1)
    askPrice?: number;

    @ApiProperty({ required: false, maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string | null;
}
