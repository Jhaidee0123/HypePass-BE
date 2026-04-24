import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class ScanTicketDto {
    @ApiProperty({ description: 'Raw QR token payload (body.sig).' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiPropertyOptional({
        description:
            'Expected session. If provided, scanner rejects tokens that do not belong to this session (wrong-event / wrong-session protection).',
    })
    @IsOptional()
    @IsUUID()
    expectedSessionId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(80)
    scannerDeviceId?: string;
}
