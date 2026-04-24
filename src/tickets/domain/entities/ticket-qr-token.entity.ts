import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { TicketQrTokenProps } from '../types/ticket-qr-token.props';
import { QrTokenReason } from '../types/qr-token-reason';

export class TicketQrTokenEntity extends BaseEntity {
    readonly ticketId: string;
    readonly tokenHash: string;
    readonly tokenVersion: number;
    readonly validFrom: Date;
    readonly validUntil?: Date | null;
    readonly isActive: boolean;
    readonly generatedReason: QrTokenReason;

    constructor(props: TicketQrTokenProps) {
        super(props);
        this.ticketId = props.ticketId;
        this.tokenHash = props.tokenHash;
        this.tokenVersion = props.tokenVersion;
        this.validFrom = props.validFrom;
        this.validUntil = props.validUntil;
        this.isActive = props.isActive;
        this.generatedReason = props.generatedReason;
    }
}
