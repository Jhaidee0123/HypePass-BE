import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class TransferTicketDto {
    @ApiProperty({ description: 'Email of a registered HypePass user.' })
    @IsEmail()
    recipientEmail: string;

    @ApiPropertyOptional({ description: 'Optional note shown to the recipient.' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
