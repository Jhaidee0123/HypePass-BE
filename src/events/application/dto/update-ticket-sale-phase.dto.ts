import { PartialType } from '@nestjs/swagger';
import { CreateTicketSalePhaseDto } from './create-ticket-sale-phase.dto';

export class UpdateTicketSalePhaseDto extends PartialType(
    CreateTicketSalePhaseDto,
) {}
