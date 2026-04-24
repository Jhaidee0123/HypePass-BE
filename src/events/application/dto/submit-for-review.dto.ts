import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitForReviewDto {
    @ApiPropertyOptional({
        description: 'Notes for the admin reviewer (optional).',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}
