import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { EVENT_STAFF_ROLE_VALUES } from '../../domain/types/event-staff-role';

export class AssignEventStaffRecipientDto {
    @ApiProperty({ example: 'María Pérez' })
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    fullName: string;

    @ApiProperty({ example: 'maria@email.com' })
    @IsEmail()
    @MaxLength(200)
    email: string;

    @ApiProperty({
        example: 'checkin_staff',
        enum: EVENT_STAFF_ROLE_VALUES,
    })
    @IsString()
    @IsIn(EVENT_STAFF_ROLE_VALUES)
    role: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    note?: string;
}

export class AssignEventStaffDto {
    @ApiProperty({ type: [AssignEventStaffRecipientDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => AssignEventStaffRecipientDto)
    recipients: AssignEventStaffRecipientDto[];
}
