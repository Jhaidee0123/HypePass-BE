import { Logger } from '@nestjs/common';
import { IPayoutRecordRepository } from '../../domain/repositories/payout-record.repository';
import { PayoutRecordEntity } from '../../domain/entities/payout-record.entity';
import { PayoutRecordStatus } from '../../domain/types/payout-record-status';
import { IPayoutMethodRepository } from '../../../payout-methods/domain/repositories/payout-method.repository';
import { WompiPayoutsService } from '../../../payments/infrastructure/services/wompi-payouts.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';

export type DispersePayoutResult =
    | {
          ok: true;
          payoutRecordId: string;
          providerReference: string;
      }
    | {
          ok: false;
          payoutRecordId: string;
          reason: string;
          permanent: boolean;
      };

/**
 * Atomically disperses one PayoutRecord to the seller's bank account via
 * Wompi Payouts. Updates the record to PAID on success or FAILED with a
 * human-readable reason. Idempotent: if the record is not in PAYABLE
 * status, it short-circuits without retrying.
 *
 * The caller (sweeper) decides when to invoke this. Errors here are
 * never thrown — the result tells the caller whether to keep going or
 * page someone.
 */
export class DispersePayoutUseCase {
    private readonly logger = new Logger(DispersePayoutUseCase.name);

    constructor(
        private readonly payouts: IPayoutRecordRepository,
        private readonly payoutMethods: IPayoutMethodRepository,
        private readonly users: IUserRepository,
        private readonly wompiPayouts: WompiPayoutsService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(payoutRecordId: string): Promise<DispersePayoutResult> {
        const record = await this.payouts.findById(payoutRecordId);
        if (!record) {
            return {
                ok: false,
                payoutRecordId,
                reason: 'PayoutRecord not found',
                permanent: true,
            };
        }
        if (record.status !== PayoutRecordStatus.PAYABLE) {
            return {
                ok: false,
                payoutRecordId,
                reason: `PayoutRecord is in status ${record.status}, not payable`,
                permanent: true,
            };
        }
        if (!record.sellerUserId) {
            return this.markFailed(
                record,
                'PayoutRecord has no sellerUserId',
                true,
            );
        }

        // Resolve the seller's default payout method
        const method = await this.payoutMethods.findDefaultForUser(
            record.sellerUserId,
        );
        if (!method) {
            return this.markFailed(
                record,
                'Seller has no default payout method configured',
                false,
            );
        }
        if (!method.verifiedAt) {
            return this.markFailed(
                record,
                'Payout method not verified yet',
                false,
            );
        }
        if (!method.wompiBankId || !method.accountType) {
            return this.markFailed(
                record,
                'Payout method is missing Wompi bank metadata (bank id / account type). Ask the user to update their payout method.',
                false,
            );
        }

        // Resolve seller email
        const seller = await this.users.findById(record.sellerUserId);
        if (!seller) {
            return this.markFailed(record, 'Seller user not found', true);
        }

        // Build a unique reference per (record, attempt). Wompi rejects
        // duplicate references — appending the attempt timestamp makes
        // retries safe.
        const reference = `hp-${record.id}-${Date.now()}`;

        const result = await this.wompiPayouts.dispersePayment({
            amountInCents: record.netAmount,
            currency: record.currency || 'COP',
            reference,
            bankId: method.wompiBankId,
            accountType: method.accountType,
            accountNumber: method.accountNumber,
            legalIdType: method.holderLegalIdType as
                | 'CC'
                | 'CE'
                | 'NIT'
                | 'PP'
                | 'TI',
            legalIdNumber: method.holderLegalId,
            holderName: method.holderName,
            holderEmail: seller.email,
            paymentType: 'OTHER',
        });

        if (!result.ok) {
            return this.markFailed(record, result.reason, false);
        }

        const updated = new PayoutRecordEntity({
            ...(record as any),
            id: record.id,
            createdAt: record.createdAt,
            status: PayoutRecordStatus.PAID,
            settledAt: new Date(),
            providerName: 'wompi',
            providerReference: result.payoutId,
            failureReason: null,
            // Snapshot the payout account at dispersion time so future
            // changes to the user's payout method don't rewrite history.
            payoutAccountType: method.accountType,
            payoutAccountBankName: method.bankName,
            payoutAccountNumber: method.accountNumber,
            payoutAccountHolderName: method.holderName,
            payoutAccountHolderLegalIdType: method.holderLegalIdType,
            payoutAccountHolderLegalId: method.holderLegalId,
            updatedAt: new Date(),
        });
        await this.payouts.update(updated);

        void this.audit
            .record({
                actorKind: 'system',
                action: 'payout.dispersed',
                targetType: 'payout',
                targetId: record.id,
                metadata: {
                    netAmount: record.netAmount,
                    currency: record.currency,
                    sellerUserId: record.sellerUserId,
                    provider: 'wompi',
                    providerReference: result.payoutId,
                    transactionType: record.transactionType,
                },
            })
            .catch(() => undefined);

        return {
            ok: true,
            payoutRecordId: record.id,
            providerReference: result.payoutId,
        };
    }

    private async markFailed(
        record: PayoutRecordEntity,
        reason: string,
        permanent: boolean,
    ): Promise<DispersePayoutResult> {
        const updated = new PayoutRecordEntity({
            ...(record as any),
            id: record.id,
            createdAt: record.createdAt,
            // Permanent failures move to FAILED so admin can intervene.
            // Non-permanent (transient) failures keep PAYABLE so the
            // sweeper retries — but we still log the attempt.
            status: permanent
                ? PayoutRecordStatus.FAILED
                : record.status,
            failureReason: reason.slice(0, 500),
            updatedAt: new Date(),
            settledAt: permanent ? new Date() : record.settledAt ?? null,
            providerName: 'wompi',
        });
        await this.payouts.update(updated);

        void this.audit
            .record({
                actorKind: 'system',
                action: 'payout.dispersion_failed',
                targetType: 'payout',
                targetId: record.id,
                metadata: {
                    reason,
                    permanent,
                    sellerUserId: record.sellerUserId,
                },
            })
            .catch(() => undefined);

        this.logger.warn(
            `Payout ${record.id} dispersion failed (${permanent ? 'permanent' : 'retryable'}): ${reason}`,
        );

        return { ok: false, payoutRecordId: record.id, reason, permanent };
    }
}
