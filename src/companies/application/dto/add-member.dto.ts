import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { COMPANY_ROLES, CompanyRole } from '../../../auth/constants';

export class AddMemberDto {
    @ApiProperty({ description: 'Email of a registered user.' })
    @IsEmail()
    email: string;

    @ApiProperty({
        enum: Object.values(COMPANY_ROLES),
        description: 'Membership role inside the company.',
    })
    @IsString()
    @IsNotEmpty()
    @IsIn(Object.values(COMPANY_ROLES))
    role: CompanyRole;
}
