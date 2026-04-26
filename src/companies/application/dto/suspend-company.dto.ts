import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SuspendCompanyDto {
    @ApiProperty({ minLength: 5 })
    @IsString()
    @MinLength(5)
    reason!: string;
}
