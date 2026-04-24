export type ResalePricingBreakdown = {
    askPrice: number;
    platformFeeAmount: number;
    sellerNetAmount: number;
    currency: string;
};

/**
 * Pure helper — compute fee + net amount for a resale listing. Seller nets
 * `askPrice - platformFee`. Buyer pays `askPrice`. Platform retains
 * `platformFee` as commission.
 */
export function computeResalePricing(
    askPrice: number,
    platformFeePct: number,
    currency: string,
): ResalePricingBreakdown {
    const platformFeeAmount = Math.round((askPrice * platformFeePct) / 100);
    const sellerNetAmount = askPrice - platformFeeAmount;
    return {
        askPrice,
        platformFeeAmount,
        sellerNetAmount,
        currency,
    };
}

/** HP-R-<slice>-<timestamp> — namespaced so resale refs don't collide with primary. */
export function makeResalePaymentReference(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    return `HP-R-${rand.toUpperCase()}-${Date.now()}`;
}
