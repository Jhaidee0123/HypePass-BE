/**
 * Supported payout destinations. These are the channels an admin will use
 * off-platform to disperse seller payouts (or, in the future, plug into
 * Wompi Payouts / Nequi API for automation).
 */
export enum PayoutMethodType {
    NEQUI = 'nequi',
    DAVIPLATA = 'daviplata',
    BANCOLOMBIA_SAVINGS = 'bancolombia_savings',
    BANCOLOMBIA_CHECKING = 'bancolombia_checking',
    BANCOLOMBIA_OTHER = 'bancolombia_other',
    OTHER_BANK = 'other_bank',
}

export const PAYOUT_METHOD_TYPES: PayoutMethodType[] = [
    PayoutMethodType.NEQUI,
    PayoutMethodType.DAVIPLATA,
    PayoutMethodType.BANCOLOMBIA_SAVINGS,
    PayoutMethodType.BANCOLOMBIA_CHECKING,
    PayoutMethodType.BANCOLOMBIA_OTHER,
    PayoutMethodType.OTHER_BANK,
];
