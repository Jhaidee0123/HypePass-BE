import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

const ACTOR_KINDS = ['user', 'system'] as const;

export class ListAuditLogsQueryDto {
    @ApiPropertyOptional({ description: 'Domain target type (e.g. company, event, payout)' })
    @IsOptional()
    @IsString()
    targetType?: string;

    @ApiPropertyOptional({ description: 'Specific target id (UUID or business id)' })
    @IsOptional()
    @IsString()
    targetId?: string;

    @ApiPropertyOptional({ description: 'Filter by actor user id' })
    @IsOptional()
    @IsString()
    actorUserId?: string;

    @ApiPropertyOptional({ enum: ACTOR_KINDS })
    @IsOptional()
    @IsIn(ACTOR_KINDS as unknown as string[])
    actorKind?: 'user' | 'system';

    @ApiPropertyOptional({ description: 'Exact action key (e.g. company.approved)' })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ description: 'Match all actions starting with this prefix (e.g. payout.)' })
    @IsOptional()
    @IsString()
    actionPrefix?: string;

    @ApiPropertyOptional({ description: 'ISO date — inclusive lower bound' })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({ description: 'ISO date — inclusive upper bound' })
    @IsOptional()
    @IsDateString()
    to?: string;

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
