import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class InitiateResaleCheckoutDto {
    @ApiProperty({ example: 'uuid-of-listing' })
    @IsString()
    listingId: string;

    @ApiProperty({ example: 'Maria Cliente' })
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    buyerFullName: string;

    @ApiProperty({ example: 'maria@example.com' })
    @IsEmail()
    buyerEmail: string;

    @ApiProperty({ example: '+573001112233', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    buyerPhone?: string;

    @ApiProperty({ example: '1020304050', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    buyerLegalId?: string;

    @ApiProperty({ example: 'CC', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    buyerLegalIdType?: string;
}
