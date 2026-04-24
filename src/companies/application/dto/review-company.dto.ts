import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewCompanyDto {
    @ApiPropertyOptional({
        description: 'Reason or notes attached to the review decision.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    reviewNotes?: string;
}
