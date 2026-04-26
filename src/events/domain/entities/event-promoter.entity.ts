import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { EventPromoterProps } from '../types/event-promoter.props';

export class EventPromoterEntity extends BaseEntity {
    readonly eventId: string;
    readonly userId: string;
    readonly referralCode: string;
    readonly assignedByUserId: string;
    readonly note: string | null;
    readonly revokedAt: Date | null;

    constructor(props: EventPromoterProps) {
        super(props);
        this.eventId = props.eventId;
        this.userId = props.userId;
        this.referralCode = props.referralCode;
        this.assignedByUserId = props.assignedByUserId;
        this.note = props.note ?? null;
        this.revokedAt = props.revokedAt ?? null;
    }
}
