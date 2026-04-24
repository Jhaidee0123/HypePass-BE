/**
 * Seed a default payout method for laura@hypepass.test so her resale listing (seeded
 * by `seed-tickets`) is valid — the marketplace use case requires a default
 * payout method before allowing a listing.
 *
 * Idempotent: skips if laura already has a default method.
 *
 * Usage:
 *   yarn db:seed-payout-methods
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PayoutMethodEntity } from '../src/payout-methods/domain/entities/payout-method.entity';
import { PayoutMethodType } from '../src/payout-methods/domain/types/payout-method-type';
import { payout_method_service_token } from '../src/payout-methods/infrastructure/tokens/payout-methods.tokens';
import { user_service_token } from '../src/users/infrastructure/tokens/users.tokens';
import type { IPayoutMethodRepository } from '../src/payout-methods/domain/repositories/payout-method.repository';
import type { IUserRepository } from '../src/users/domain/repositories/user.repository';

const SELLER_EMAIL = 'laura@hypepass.test';

async function main() {
    process.env.SWEEPER_ENABLED = 'false';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    const userRepo = app.get<IUserRepository>(user_service_token);
    const payoutRepo = app.get<IPayoutMethodRepository>(
        payout_method_service_token,
    );

    console.log('→ Seeding payout methods…');

    const user = await userRepo.findByEmail(SELLER_EMAIL);
    if (!user) {
        console.error(
            `  ✗ user ${SELLER_EMAIL} not found. Run yarn db:seed-users first.`,
        );
        await app.close();
        process.exit(1);
    }

    const existing = await payoutRepo.findDefaultForUser(user.id);
    if (existing) {
        console.log(`  · ${SELLER_EMAIL} already has a default payout method`);
        await app.close();
        return;
    }

    await payoutRepo.create(
        new PayoutMethodEntity({
            userId: user.id,
            type: PayoutMethodType.NEQUI,
            bankName: null,
            accountNumber: '3001234567',
            holderName: 'Laura Reseller',
            holderLegalIdType: 'CC',
            holderLegalId: '1020304050',
            isDefault: true,
            verifiedAt: new Date(),
        }),
    );
    console.log(`  ✓ default Nequi payout method created for ${SELLER_EMAIL}`);

    await app.close();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
