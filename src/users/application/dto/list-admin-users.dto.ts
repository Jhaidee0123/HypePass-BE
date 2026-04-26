import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBooleanString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class ListAdminUsersQueryDto {
    @ApiPropertyOptional({ description: 'Free-text match against email or name' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ enum: ['user', 'platform_admin'] })
    @IsOptional()
    @IsIn(['user', 'platform_admin'])
    role?: 'user' | 'platform_admin';

    @ApiPropertyOptional({ description: 'Filter by ban status' })
    @IsOptional()
    @IsBooleanString()
    banned?: 'true' | 'false';

    @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;

    @ApiPropertyOptional({ default: 0, minimum: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;
}
