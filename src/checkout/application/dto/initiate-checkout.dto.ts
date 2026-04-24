import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class InitiateCheckoutDto {
    @ApiProperty()
    @IsUUID()
    eventId: string;

    @ApiProperty()
    @IsUUID()
    eventSessionId: string;

    @ApiProperty()
    @IsUUID()
    ticketSectionId: string;

    @ApiProperty()
    @IsUUID()
    ticketSalePhaseId: string;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    /** Buyer contact (required for Wompi). For authenticated users, name/email
     *  are overwritten server-side from the session. */
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    customerFullName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    customerEmail?: string;

    @ApiProperty({ example: '+573001234567' })
    @IsString()
    @MinLength(7)
    @MaxLength(40)
    @Matches(/^\+?[0-9\s-]+$/, { message: 'phone must be digits + optional prefix' })
    customerPhone: string;

    @ApiProperty({ example: '1020304050' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
    customerLegalId: string;

    @ApiProperty({ example: 'CC' })
    @IsString()
    @IsIn(['CC', 'CE', 'NIT', 'PP', 'TI'])
    customerLegalIdType: string;
}

/** Guest variant — same fields, but name + email are REQUIRED (no session). */
export class GuestInitiateCheckoutDto {
    @ApiProperty()
    @IsUUID()
    eventId: string;

    @ApiProperty()
    @IsUUID()
    eventSessionId: string;

    @ApiProperty()
    @IsUUID()
    ticketSectionId: string;

    @ApiProperty()
    @IsUUID()
    ticketSalePhaseId: string;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    customerFullName: string;

    @ApiProperty()
    @IsEmail()
    customerEmail: string;

    @ApiProperty({ example: '+573001234567' })
    @IsString()
    @MinLength(7)
    @MaxLength(40)
    @Matches(/^\+?[0-9\s-]+$/)
    customerPhone: string;

    @ApiProperty({ example: '1020304050' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
    customerLegalId: string;

    @ApiProperty({ example: 'CC' })
    @IsString()
    @IsIn(['CC', 'CE', 'NIT', 'PP', 'TI'])
    customerLegalIdType: string;

    @ApiProperty({
        example: '2026-04-v1',
        description:
            'Version of the Terms & Conditions the guest accepts at checkout.',
    })
    @IsString()
    @Matches(/^\d{4}-\d{2}-v\d+$/, {
        message: 'acceptedTermsVersion must match YYYY-MM-vN',
    })
    acceptedTermsVersion: string;

    @ApiProperty({ example: '2026-04-v1' })
    @IsString()
    @Matches(/^\d{4}-\d{2}-v\d+$/, {
        message: 'acceptedPrivacyVersion must match YYYY-MM-vN',
    })
    acceptedPrivacyVersion: string;
}
