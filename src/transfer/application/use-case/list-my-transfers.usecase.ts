import { TicketTransferEntity } from '../../../tickets/domain/entities/ticket-transfer.entity';
import { ITicketTransferRepository } from '../../../tickets/domain/repositories/ticket-transfer.repository';

export type ListMyTransfersResult = {
    sent: TicketTransferEntity[];
    received: TicketTransferEntity[];
};

export class ListMyTransfersUseCase {
    constructor(private readonly repo: ITicketTransferRepository) {}

    async execute(userId: string): Promise<ListMyTransfersResult> {
        const [sent, received] = await Promise.all([
            this.repo.findSentByUser(userId),
            this.repo.findReceivedByUser(userId),
        ]);
        return { sent, received };
    }
}
