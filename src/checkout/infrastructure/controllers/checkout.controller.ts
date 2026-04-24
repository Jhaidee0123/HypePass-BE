import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Post,
    Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import {
    AllowAnonymous,
    Session,
} from '../../../auth/decorators';
import { UserSession } from '../../../auth';
import {
    GuestInitiateCheckoutDto,
    InitiateCheckoutDto,
} from '../../application/dto/initiate-checkout.dto';
import {
    handle_webhook_usecase_token,
    initiate_checkout_usecase_token,
    initiate_guest_checkout_usecase_token,
    verify_payment_usecase_token,
} from '../tokens/checkout.tokens';
import { InitiateCheckoutUseCase } from '../../application/use-case/initiate-checkout.usecase';
import { InitiateGuestCheckoutUseCase } from '../../application/use-case/initiate-guest-checkout.usecase';
import { VerifyPaymentUseCase } from '../../application/use-case/verify-payment.usecase';
import { HandleWebhookUseCase } from '../../application/use-case/handle-webhook.usecase';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
    constructor(
        @Inject(initiate_checkout_usecase_token)
        private readonly initiate: InitiateCheckoutUseCase,
        @Inject(initiate_guest_checkout_usecase_token)
        private readonly initiateGuest: InitiateGuestCheckoutUseCase,
        @Inject(verify_payment_usecase_token)
        private readonly verify: VerifyPaymentUseCase,
        @Inject(handle_webhook_usecase_token)
        private readonly webhook: HandleWebhookUseCase,
    ) {}

    @Post('initiate')
    @Throttle({
        default: {
            limit: Number(process.env.THROTTLE_CHECKOUT_LIMIT ?? 10),
            ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
        },
    })
    @ApiCookieAuth()
    @HttpCode(HttpStatus.OK)
    async initiateAuthenticated(
        @Session() session: UserSession,
        @Body() dto: InitiateCheckoutDto,
    ) {
        return this.initiate.execute({
            userId: session.user.id,
            buyerFullName: dto.customerFullName ?? session.user.name,
            buyerEmail: dto.customerEmail ?? session.user.email,
            buyerPhone: dto.customerPhone,
            buyerLegalId: dto.customerLegalId,
            buyerLegalIdType: dto.customerLegalIdType,
            selection: {
                eventId: dto.eventId,
                eventSessionId: dto.eventSessionId,
                ticketSectionId: dto.ticketSectionId,
                ticketSalePhaseId: dto.ticketSalePhaseId,
                quantity: dto.quantity,
            },
        });
    }

    @Post('guest-initiate')
    @AllowAnonymous()
    @Throttle({
        default: {
            limit: Number(process.env.THROTTLE_CHECKOUT_LIMIT ?? 10),
            ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
        },
    })
    @HttpCode(HttpStatus.OK)
    async initiateGuestCheckout(
        @Body() dto: GuestInitiateCheckoutDto,
        @Req() req: Request,
    ) {
        const xff = req.headers['x-forwarded-for'];
        const ipAddress =
            typeof xff === 'string' && xff.length > 0
                ? xff.split(',')[0].trim().slice(0, 64)
                : (req.ip ?? null)?.slice(0, 64) ?? null;
        const userAgent =
            (req.headers['user-agent'] as string | undefined)?.slice(
                0,
                300,
            ) ?? null;
        return this.initiateGuest.execute(dto, { ipAddress, userAgent });
    }

    @Get('verify/:reference')
    @AllowAnonymous()
    async verifyByReference(@Param('reference') reference: string) {
        return this.verify.execute(reference);
    }

    @Post('webhook')
    @AllowAnonymous()
    @SkipThrottle()
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() payload: unknown) {
        return this.webhook.execute(payload);
    }
}
