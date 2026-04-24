import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApproveEventDto {
    @ApiPropertyOptional({ description: 'Optional notes shown to the organizer.' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    reviewNotes?: string;
}

export class RejectEventDto {
    @ApiProperty({
        description:
            'Reason / notes (required) explaining why the event was rejected.',
    })
    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    reviewNotes: string;
}
