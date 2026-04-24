import { BaseProps } from '../../../shared/domain/types/base.props';
import { PayoutMethodType } from './payout-method-type';

export type PayoutMethodProps = BaseProps & {
    userId: string;
    type: PayoutMethodType;
    /** Additional free-text for OTHER_BANK: bank name. Null otherwise. */
    bankName?: string | null;
    accountNumber: string;
    holderName: string;
    holderLegalIdType: string; // 'CC' | 'CE' | 'NIT' | 'PP' | 'TI'
    holderLegalId: string;
    isDefault: boolean;
    verifiedAt?: Date | null;
};
