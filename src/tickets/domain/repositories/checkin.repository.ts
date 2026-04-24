import { CheckinEntity } from '../entities/checkin.entity';

export interface ICheckinRepository {
    findAcceptedByTicket(ticketId: string): Promise<CheckinEntity | null>;
    findByTicket(ticketId: string): Promise<CheckinEntity[]>;
    create(entity: CheckinEntity): Promise<CheckinEntity>;
}
