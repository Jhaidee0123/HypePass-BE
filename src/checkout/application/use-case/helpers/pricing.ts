import { TicketSalePhaseEntity } from '../../../../events/domain/entities/ticket-sale-phase.entity';

export type PricingBreakdown = {
    unitPrice: number;
    serviceFeePerUnit: number;
    platformFeePerUnit: number;
    taxPerUnit: number;
    subtotal: number;
    serviceFeeTotal: number;
    platformFeeTotal: number;
    taxTotal: number;
    grandTotal: number;
    currency: string;
};

/**
 * Pure function — compute pricing breakdown for a quantity on a given phase.
 * Service fee and tax are additive (buyer pays). Platform fee is informational
 * (commission we retain from the organizer's share later on, at settlement).
 */
export function computePricing(
    phase: TicketSalePhaseEntity,
    quantity: number,
    platformFeePctDefault: number,
): PricingBreakdown {
    const unitPrice = phase.price;
    const serviceFeePerUnit = phase.serviceFee ?? 0;
    const taxPerUnit = phase.taxAmount ?? 0;
    const platformFeePerUnit =
        phase.platformFee !== null && phase.platformFee !== undefined
            ? phase.platformFee
            : Math.round((unitPrice * platformFeePctDefault) / 100);

    const subtotal = unitPrice * quantity;
    const serviceFeeTotal = serviceFeePerUnit * quantity;
    const platformFeeTotal = platformFeePerUnit * quantity;
    const taxTotal = taxPerUnit * quantity;
    const grandTotal = subtotal + serviceFeeTotal + taxTotal;

    return {
        unitPrice,
        serviceFeePerUnit,
        platformFeePerUnit,
        taxPerUnit,
        subtotal,
        serviceFeeTotal,
        platformFeeTotal,
        taxTotal,
        grandTotal,
        currency: phase.currency,
    };
}

/** HP-<slice>-<timestamp> — matches HotCaps' reference format. */
export function makePaymentReference(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    return `HP-${rand.toUpperCase()}-${Date.now()}`;
}
