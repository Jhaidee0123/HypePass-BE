import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class CourtesyRecipientDto {
    @ApiProperty({ example: 'María Pérez' })
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    fullName: string;

    @ApiProperty({ example: 'maria@email.com' })
    @IsEmail()
    @MaxLength(200)
    email: string;

    @ApiProperty({ example: '1020304050' })
    @IsString()
    @MinLength(3)
    @MaxLength(40)
    legalId: string;

    @ApiProperty({
        example: 'CC',
        description: 'CC, CE, TI, PP, NIT...',
    })
    @IsString()
    @MaxLength(10)
    legalIdType: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    note?: string;
}

export class IssueCourtesiesDto {
    @ApiProperty()
    @IsUUID()
    eventSessionId: string;

    @ApiProperty()
    @IsUUID()
    ticketSectionId: string;

    @ApiProperty({ type: [CourtesyRecipientDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => CourtesyRecipientDto)
    recipients: CourtesyRecipientDto[];
}
