import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { PaymentGatewayName } from '../../../payments/domain/types/payment-gateway-name';
import { CompanyProps } from '../types/company.props';
import { CompanyStatus } from '../types/company-status';

export class CompanyEntity extends BaseEntity {
    readonly name: string;
    readonly slug: string;
    readonly legalName?: string | null;
    readonly taxId?: string | null;
    readonly contactEmail?: string | null;
    readonly logoUrl?: string | null;
    readonly status: CompanyStatus;
    readonly reviewedByUserId?: string | null;
    readonly reviewedAt?: Date | null;
    readonly reviewNotes?: string | null;
    readonly preferredGateway: PaymentGatewayName;

    constructor(props: CompanyProps) {
        super(props);
        this.name = props.name;
        this.slug = props.slug;
        this.legalName = props.legalName;
        this.taxId = props.taxId;
        this.contactEmail = props.contactEmail;
        this.logoUrl = props.logoUrl;
        this.status = props.status;
        this.reviewedByUserId = props.reviewedByUserId;
        this.reviewedAt = props.reviewedAt;
        this.reviewNotes = props.reviewNotes;
        this.preferredGateway = props.preferredGateway ?? 'wompi';
    }
}
