import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateSupportTicketDto {
    @ApiProperty({ enum: ['support', 'dispute', 'kyc'] })
    @IsIn(['support', 'dispute', 'kyc'])
    kind!: 'support' | 'dispute' | 'kyc';

    @ApiProperty({ minLength: 4, maxLength: 200 })
    @IsString()
    @MinLength(4)
    @MaxLength(200)
    subject!: string;

    @ApiProperty({ minLength: 10 })
    @IsString()
    @MinLength(10)
    @MaxLength(5000)
    body!: string;

    @ApiPropertyOptional({ description: 'Required if user is not authenticated' })
    @IsOptional()
    @IsEmail()
    guestEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    relatedOrderId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    relatedCompanyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    relatedEventId?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}

export class ReplySupportTicketDto {
    @ApiProperty({ minLength: 1 })
    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    body!: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}

export class UpdateSupportStatusDto {
    @ApiProperty({ enum: ['open', 'in_progress', 'resolved', 'closed'] })
    @IsIn(['open', 'in_progress', 'resolved', 'closed'])
    status!: 'open' | 'in_progress' | 'resolved' | 'closed';
}
