import { PartialType } from '@nestjs/swagger';
import { CreateTicketSectionDto } from './create-ticket-section.dto';

export class UpdateTicketSectionDto extends PartialType(CreateTicketSectionDto) {}
