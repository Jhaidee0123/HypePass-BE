import { Injectable } from '@nestjs/common';
import { AdminOrderService } from '../services/admin-order.service';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

@Injectable()
export class AdminMarkOrderReconciledUseCase {
    constructor(
        private readonly orders: AdminOrderService,
        private readonly audit: AuditLogService,
    ) {}

    async execute(orderId: string, actorUserId: string) {
        const updated = await this.orders.markReconciled(orderId);
        void this.audit.record({
            action: 'order.marked_reconciled',
            actorUserId,
            targetType: 'order',
            targetId: orderId,
            metadata: null,
        });
        return updated;
    }
}
