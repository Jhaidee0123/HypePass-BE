import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toCsv } from '../services/csv.helper';

@Injectable()
export class ExportUsersUseCase {
    constructor(private readonly ds: DataSource) {}

    async execute(): Promise<string> {
        const rows = await this.ds.query(
            `SELECT id, email, name, role,
                    COALESCE(banned, false) AS banned,
                    "banReason" AS ban_reason,
                    "banExpires" AS ban_expires,
                    "phoneNumber" AS phone_number,
                    "createdAt" AS created_at,
                    "emailVerified" AS email_verified
             FROM "user"
             ORDER BY "createdAt" DESC
             LIMIT 10000`,
        );
        return toCsv(
            [
                'id',
                'email',
                'name',
                'role',
                'banned',
                'ban_reason',
                'ban_expires',
                'phone_number',
                'created_at',
                'email_verified',
            ],
            rows as Array<Record<string, unknown>>,
        );
    }
}
