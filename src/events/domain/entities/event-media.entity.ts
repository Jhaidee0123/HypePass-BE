import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { EventMediaProps } from '../types/event-media.props';
import { EventMediaType } from '../types/event-media-type';

export class EventMediaEntity extends BaseEntity {
    readonly eventId: string;
    readonly url: string;
    readonly publicId?: string | null;
    readonly type: EventMediaType;
    readonly sortOrder: number;
    readonly alt?: string | null;

    constructor(props: EventMediaProps) {
        super(props);
        this.eventId = props.eventId;
        this.url = props.url;
        this.publicId = props.publicId;
        this.type = props.type;
        this.sortOrder = props.sortOrder;
        this.alt = props.alt;
    }
}
