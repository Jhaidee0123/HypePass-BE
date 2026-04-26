import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toCsv } from '../services/csv.helper';

@Injectable()
export class ExportPayoutsUseCase {
    constructor(private readonly ds: DataSource) {}

    async execute(filter: { status?: string }): Promise<string> {
        const params: unknown[] = [];
        const where: string[] = [];
        if (filter.status) {
            params.push(filter.status);
            where.push(`p.status = $${params.length}`);
        }

        const rows = await this.ds.query(
            `SELECT
                p.id, p.created_at, p.status, p.transaction_type,
                p.gross_amount, p.platform_fee, p.net_amount, p.currency,
                p.seller_user_id, p.company_id, p.resale_listing_id,
                p.event_session_id, p.release_at, p.settled_at,
                p.payout_account_type, p.payout_account_bank_name,
                p.payout_account_number, p.payout_account_holder_name
             FROM payout_records p
             ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
             ORDER BY p.created_at DESC
             LIMIT 5000`,
            params,
        );

        return toCsv(
            [
                'id',
                'created_at',
                'status',
                'transaction_type',
                'gross_amount',
                'platform_fee',
                'net_amount',
                'currency',
                'seller_user_id',
                'company_id',
                'resale_listing_id',
                'event_session_id',
                'release_at',
                'settled_at',
                'payout_account_type',
                'payout_account_bank_name',
                'payout_account_number',
                'payout_account_holder_name',
            ],
            rows as Array<Record<string, unknown>>,
        );
    }
}
