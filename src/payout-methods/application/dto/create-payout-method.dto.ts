import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { PayoutMethodType } from '../../domain/types/payout-method-type';

export class CreatePayoutMethodDto {
    @ApiProperty({ enum: PayoutMethodType })
    @IsEnum(PayoutMethodType)
    type: PayoutMethodType;

    @ApiPropertyOptional({ description: 'Required for OTHER_BANK.' })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    bankName?: string;

    @ApiProperty({ example: '3117673405' })
    @IsString()
    @MinLength(5)
    @MaxLength(40)
    accountNumber: string;

    @ApiProperty({ example: 'Jhon Jhaider Betancur' })
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    holderName: string;

    @ApiProperty({ example: 'CC' })
    @IsString()
    @MaxLength(10)
    holderLegalIdType: string;

    @ApiProperty({ example: '1036404019' })
    @IsString()
    @MinLength(3)
    @MaxLength(40)
    holderLegalId: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    makeDefault?: boolean;

    @ApiPropertyOptional({
        description:
            'Wompi bank UUID from /banks. Required for automated payout dispersion.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    wompiBankId?: string;

    @ApiPropertyOptional({ enum: ['AHORROS', 'CORRIENTE'] })
    @IsOptional()
    @IsIn(['AHORROS', 'CORRIENTE'])
    accountType?: 'AHORROS' | 'CORRIENTE';
}
