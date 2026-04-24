export type InitiateCheckoutResponse = {
    orderId: string;
    paymentId: string;
    reference: string;
    amountInCents: number;
    currency: string;
    signature: string;
    publicKey: string;
    customerEmail: string;
    customerFullName: string;
    customerPhone: string;
    customerLegalId: string;
    customerLegalIdType: string;
    reservedUntil: string;
};
