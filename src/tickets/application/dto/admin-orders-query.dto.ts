import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBooleanString,
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export class AdminOrdersQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ enum: ['pending', 'paid', 'cancelled', 'expired', 'failed'] })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ enum: ['primary', 'resale'] })
    @IsOptional()
    @IsIn(['primary', 'resale'])
    type?: 'primary' | 'resale';

    @ApiPropertyOptional()
    @IsOptional()
    @IsBooleanString()
    needsReconciliation?: 'true' | 'false';

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    companyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({ default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;
}
