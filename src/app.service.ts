import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    async health() {
        const started = Date.now();
        let dbStatus: 'up' | 'down' = 'up';
        let dbLatencyMs: number | null = null;
        try {
            const t0 = Date.now();
            await this.dataSource.query('SELECT 1');
            dbLatencyMs = Date.now() - t0;
        } catch {
            dbStatus = 'down';
        }
        return {
            status: dbStatus === 'up' ? 'ok' : 'degraded',
            service: 'HypePass API',
            timestamp: new Date().toISOString(),
            db: { status: dbStatus, latencyMs: dbLatencyMs },
            uptimeSec: Math.round(process.uptime()),
            checkLatencyMs: Date.now() - started,
        };
    }
}
