import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toCsv } from '../services/csv.helper';

export type ExportOrdersFilter = {
    status?: string;
    type?: string;
    companyId?: string;
    needsReconciliation?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
};

@Injectable()
export class ExportOrdersUseCase {
    constructor(private readonly ds: DataSource) {}

    async execute(filter: ExportOrdersFilter): Promise<string> {
        const params: unknown[] = [];
        const where: string[] = [];
        const push = (sql: string, value: unknown) => {
            params.push(value);
            where.push(sql.replace('?', `$${params.length}`));
        };
        if (filter.status) push('o.status = ?', filter.status);
        if (filter.type) push('o.type = ?', filter.type);
        if (filter.companyId) push('o.company_id = ?', filter.companyId);
        if (filter.needsReconciliation !== undefined) {
            push('o.needs_reconciliation = ?', filter.needsReconciliation);
        }
        if (filter.dateFrom) push('o.created_at >= ?', filter.dateFrom);
        if (filter.dateTo) push('o.created_at <= ?', filter.dateTo);

        const rows = await this.ds.query<
            Array<{
                id: string;
                created_at: Date;
                status: string;
                type: string;
                currency: string;
                grand_total: number;
                platform_fee_total: number;
                payment_reference: string;
                buyer_email: string;
                buyer_full_name: string;
                buyer_phone: string | null;
                buyer_legal_id: string | null;
                company_id: string | null;
                needs_reconciliation: boolean;
                reconciliation_reason: string | null;
            }>
        >(
            `SELECT
                o.id, o.created_at, o.status, o.type, o.currency,
                o.grand_total, o.platform_fee_total,
                o.payment_reference, o.buyer_email, o.buyer_full_name,
                o.buyer_phone, o.buyer_legal_id,
                o.company_id, o.needs_reconciliation, o.reconciliation_reason
             FROM orders o
             ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
             ORDER BY o.created_at DESC
             LIMIT 5000`,
            params,
        );

        return toCsv(
            [
                'id',
                'created_at',
                'status',
                'type',
                'currency',
                'grand_total',
                'platform_fee_total',
                'payment_reference',
                'buyer_email',
                'buyer_full_name',
                'buyer_phone',
                'buyer_legal_id',
                'company_id',
                'needs_reconciliation',
                'reconciliation_reason',
            ],
            rows as unknown as Array<Record<string, unknown>>,
        );
    }
}
