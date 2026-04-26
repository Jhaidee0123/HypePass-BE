import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class BanUserDto {
    @ApiProperty({ description: 'Reason logged in audit + shown to the user', minLength: 5 })
    @IsString()
    @MinLength(5)
    reason!: string;

    @ApiPropertyOptional({ description: 'ISO date when ban auto-expires (omit for indefinite)' })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}
