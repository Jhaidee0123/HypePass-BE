import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateResaleListingDto {
    @ApiProperty({ example: 'uuid-of-ticket' })
    @IsString()
    ticketId: string;

    @ApiProperty({
        example: 18000000,
        description: 'Ask price in integer cents (COP)',
    })
    @IsInt()
    @Min(1)
    askPrice: number;

    @ApiProperty({ required: false, maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
