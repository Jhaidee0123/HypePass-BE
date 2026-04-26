import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { EventProps } from '../types/event.props';
import { EventStatus } from '../types/event-status';

export class EventEntity extends BaseEntity {
    readonly companyId: string;
    readonly categoryId?: string | null;
    readonly venueId?: string | null;
    readonly title: string;
    readonly slug: string;
    readonly shortDescription?: string | null;
    readonly description?: string | null;
    readonly coverImageUrl?: string | null;
    readonly bannerImageUrl?: string | null;
    readonly status: EventStatus;
    readonly publicationSubmittedAt?: Date | null;
    readonly publicationApprovedAt?: Date | null;
    readonly publicationRejectedAt?: Date | null;
    readonly publicationReviewedBy?: string | null;
    readonly resaleEnabled: boolean;
    readonly transferEnabled: boolean;
    readonly defaultQrVisibleHoursBefore?: number | null;
    readonly currency: string;
    readonly resalePriceCapMultiplier?: number | null;
    readonly resaleFeePct?: number | null;
    readonly maxTicketsPerUserPerSession?: number | null;
    readonly locationName?: string | null;
    readonly locationAddress?: string | null;
    readonly locationLatitude?: number | null;
    readonly locationLongitude?: number | null;

    constructor(props: EventProps) {
        super(props);
        this.companyId = props.companyId;
        this.categoryId = props.categoryId;
        this.venueId = props.venueId;
        this.title = props.title;
        this.slug = props.slug;
        this.shortDescription = props.shortDescription;
        this.description = props.description;
        this.coverImageUrl = props.coverImageUrl;
        this.bannerImageUrl = props.bannerImageUrl;
        this.status = props.status;
        this.publicationSubmittedAt = props.publicationSubmittedAt;
        this.publicationApprovedAt = props.publicationApprovedAt;
        this.publicationRejectedAt = props.publicationRejectedAt;
        this.publicationReviewedBy = props.publicationReviewedBy;
        this.resaleEnabled = props.resaleEnabled;
        this.transferEnabled = props.transferEnabled;
        this.defaultQrVisibleHoursBefore = props.defaultQrVisibleHoursBefore;
        this.currency = props.currency;
        this.resalePriceCapMultiplier = props.resalePriceCapMultiplier ?? null;
        this.resaleFeePct = props.resaleFeePct ?? null;
        this.maxTicketsPerUserPerSession =
            props.maxTicketsPerUserPerSession ?? null;
        this.locationName = props.locationName ?? null;
        this.locationAddress = props.locationAddress ?? null;
        this.locationLatitude = props.locationLatitude ?? null;
        this.locationLongitude = props.locationLongitude ?? null;
    }
}
