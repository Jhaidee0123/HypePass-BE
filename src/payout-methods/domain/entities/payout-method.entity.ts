import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { PayoutMethodProps } from '../types/payout-method.props';
import { PayoutMethodType } from '../types/payout-method-type';

export class PayoutMethodEntity extends BaseEntity {
    readonly userId: string;
    readonly type: PayoutMethodType;
    readonly bankName?: string | null;
    readonly accountNumber: string;
    readonly holderName: string;
    readonly holderLegalIdType: string;
    readonly holderLegalId: string;
    readonly isDefault: boolean;
    readonly verifiedAt?: Date | null;

    constructor(props: PayoutMethodProps) {
        super(props);
        this.userId = props.userId;
        this.type = props.type;
        this.bankName = props.bankName ?? null;
        this.accountNumber = props.accountNumber;
        this.holderName = props.holderName;
        this.holderLegalIdType = props.holderLegalIdType;
        this.holderLegalId = props.holderLegalId;
        this.isDefault = props.isDefault;
        this.verifiedAt = props.verifiedAt ?? null;
    }
}
