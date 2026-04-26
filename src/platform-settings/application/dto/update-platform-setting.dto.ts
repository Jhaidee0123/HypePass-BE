import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlatformSettingDto {
    @ApiProperty({
        description:
            'New value. Must match the type declared in the catalog (boolean/number/string/string[]).',
    })
    value!: unknown;
}
