import { Injectable, Logger } from '@nestjs/common';
import { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { PaymentGatewayName } from '../../domain/types/payment-gateway-name';
import { WompiService } from '../../infrastructure/services/wompi.service';
import { MercadoPagoService } from '../../infrastructure/services/mercadopago.service';

/**
 * Resolves which `PaymentGatewayPort` to use for a given gateway name.
 * Used at checkout time to route the buyer through the correct
 * provider based on the company's `preferred_gateway`.
 *
 * Wompi is the default fallback when nothing is specified — preserves
 * the pre-MP behavior for any caller that hasn't been updated yet.
 */
@Injectable()
export class PaymentGatewayRegistry {
    private readonly logger = new Logger(PaymentGatewayRegistry.name);
    private readonly map: Record<PaymentGatewayName, PaymentGatewayPort>;

    constructor(
        private readonly wompi: WompiService,
        private readonly mercadopago: MercadoPagoService,
    ) {
        this.map = {
            wompi: this.wompi,
            mercadopago: this.mercadopago,
        };
    }

    resolve(gateway?: PaymentGatewayName | null): PaymentGatewayPort {
        const name: PaymentGatewayName = gateway ?? 'wompi';
        const port = this.map[name];
        if (!port) {
            this.logger.warn(
                `Unknown gateway "${name}" — falling back to wompi`,
            );
            return this.wompi;
        }
        return port;
    }
}
