import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
    @ApiProperty({ enum: ['user', 'platform_admin'] })
    @IsIn(['user', 'platform_admin'])
    role!: 'user' | 'platform_admin';
}
