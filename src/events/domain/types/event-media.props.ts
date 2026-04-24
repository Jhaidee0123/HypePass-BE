import { BaseProps } from '../../../shared/domain/types/base.props';
import { EventMediaType } from './event-media-type';

export type EventMediaProps = BaseProps & {
    eventId: string;
    url: string;
    publicId?: string | null;
    type: EventMediaType;
    sortOrder: number;
    alt?: string | null;
};
