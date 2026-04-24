import {
    ConflictDomainException,
    NotFoundDomainException,
} from '../../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';
import { AuditLogAction } from '../../../../audit/domain/types/audit-log-action';
import { PayoutRecordEntity } from '../../../domain/entities/payout-record.entity';
import { IPayoutRecordRepository } from '../../../domain/repositories/payout-record.repository';
import { PayoutRecordStatus } from '../../../domain/types/payout-record-status';

type Outcome = 'paid' | 'failed' | 'cancelled';

/**
 * Admin-only: transitions a payout from PAYABLE to PAID/FAILED/CANCELLED.
 * This is where, in a future integration, we would fire off the actual
 * dispersion (Wompi link, Nequi, wire). Today it only updates the record —
 * the bank action happens out-of-band. Audited.
 */
export class MarkPayoutUseCase {
    constructor(
        private readonly repo: IPayoutRecordRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        payoutId: string,
        outcome: Outcome,
        adminUserId?: string,
    ): Promise<PayoutRecordEntity> {
        const payout = await this.repo.findById(payoutId);
        if (!payout) throw new NotFoundDomainException('Payout not found');

        if (payout.status !== PayoutRecordStatus.PAYABLE) {
            throw new ConflictDomainException(
                `Payout is not payable (status: ${payout.status})`,
                'PAYOUT_NOT_PAYABLE',
            );
        }

        const nextStatus =
            outcome === 'paid'
                ? PayoutRecordStatus.PAID
                : outcome === 'failed'
                  ? PayoutRecordStatus.FAILED
                  : PayoutRecordStatus.CANCELLED;

        const updated = await this.repo.update(
            new PayoutRecordEntity({
                ...payout,
                id: payout.id,
                createdAt: payout.createdAt,
                status: nextStatus,
                updatedAt: new Date(),
            } as any),
        );

        const action: AuditLogAction =
            outcome === 'paid'
                ? 'payout.marked_paid'
                : outcome === 'failed'
                  ? 'payout.marked_failed'
                  : 'payout.cancelled';
        await this.audit.record({
            action,
            targetType: 'payout',
            targetId: updated.id,
            actorUserId: adminUserId ?? null,
            metadata: {
                netAmount: updated.netAmount,
                grossAmount: updated.grossAmount,
                currency: updated.currency,
                sellerUserId: updated.sellerUserId,
            },
        });

        return updated;
    }
}
