import { PartialType } from '@nestjs/swagger';
import { CreatePayoutMethodDto } from './create-payout-method.dto';

export class UpdatePayoutMethodDto extends PartialType(
    CreatePayoutMethodDto,
) {}
