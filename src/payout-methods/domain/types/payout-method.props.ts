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
    /** UUID of the bank in Wompi's catalog (`GET /banks`). Required for
     *  automated disbursement via Wompi Payouts API. Null for legacy rows
     *  created before automated payouts. */
    wompiBankId?: string | null;
    /** AHORROS | CORRIENTE — needed by Wompi Payouts. Null if not
     *  applicable (Nequi/Daviplata) or legacy. */
    accountType?: 'AHORROS' | 'CORRIENTE' | null;
};
