/**
 * Stable identifier of a payment gateway. Used as discriminator in
 * `company_payment_gateway_credentials.gateway` and as the `name` field
 * on each `PaymentGatewayPort` adapter.
 */
export type PaymentGatewayName = 'wompi' | 'mercadopago';

export const PAYMENT_GATEWAY_NAMES: PaymentGatewayName[] = [
    'wompi',
    'mercadopago',
];
