import { PartialType } from '@nestjs/swagger';
import { CreateEventSessionDto } from './create-event-session.dto';

export class UpdateEventSessionDto extends PartialType(CreateEventSessionDto) {}
