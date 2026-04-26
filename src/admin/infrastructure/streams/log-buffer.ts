/**
 * In-memory ring buffer that captures pino log lines so we can expose them
 * to the admin UI (`GET /api/admin/system-logs`) without provisioning an
 * external log store. The buffer is intentionally bounded so it cannot leak
 * memory under pressure — old entries get evicted as new ones arrive.
 *
 * The pino stream that feeds it is a plain `Writable` so it composes with
 * `pino.multistream`, leaving stdout/pm2 capture untouched.
 */
import { Writable } from 'stream';

export type SystemLogEntry = {
    time: string;
    level: number;
    levelLabel: string;
    msg: string;
    context?: string;
    raw: Record<string, unknown>;
};

const LEVEL_LABEL: Record<number, string> = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal',
};

const MAX_ENTRIES = 1000;

const buffer: SystemLogEntry[] = [];

const pushEntry = (entry: SystemLogEntry) => {
    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) {
        buffer.splice(0, buffer.length - MAX_ENTRIES);
    }
};

const safeParse = (chunk: Buffer | string): Record<string, unknown> | null => {
    try {
        const txt = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        return JSON.parse(txt) as Record<string, unknown>;
    } catch {
        return null;
    }
};

const buildEntry = (raw: Record<string, unknown>): SystemLogEntry => {
    const level = Number(raw.level ?? 30);
    const time = raw.time ? new Date(Number(raw.time)).toISOString() : new Date().toISOString();
    const msg = (raw.msg as string) ?? '';
    const context =
        (raw.context as string | undefined) ??
        (raw.req && typeof raw.req === 'object' && (raw.req as any).url
            ? `HTTP ${(raw.req as any).method} ${(raw.req as any).url}`
            : undefined);
    return {
        time,
        level,
        levelLabel: LEVEL_LABEL[level] ?? String(level),
        msg,
        context,
        raw,
    };
};

class LogBufferWritable extends Writable {
    _write(
        chunk: Buffer | string,
        _enc: BufferEncoding,
        cb: (err?: Error | null) => void,
    ): void {
        const parsed = safeParse(chunk);
        if (parsed) {
            try {
                pushEntry(buildEntry(parsed));
            } catch {
                // never fail the pipeline because of the buffer
            }
        }
        cb();
    }
}

export const logBufferStream = new LogBufferWritable({ decodeStrings: false });

export type SystemLogsQuery = {
    level?: 'debug' | 'info' | 'warn' | 'error';
    contains?: string;
    limit?: number;
};

const LEVEL_THRESHOLD: Record<NonNullable<SystemLogsQuery['level']>, number> = {
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
};

export const readSystemLogs = (query: SystemLogsQuery = {}): SystemLogEntry[] => {
    const limit = Math.min(Math.max(query.limit ?? 200, 1), 1000);
    const minLevel = query.level ? LEVEL_THRESHOLD[query.level] : 0;
    const needle = query.contains?.toLowerCase();
    const out: SystemLogEntry[] = [];
    for (let i = buffer.length - 1; i >= 0 && out.length < limit; i -= 1) {
        const entry = buffer[i];
        if (entry.level < minLevel) continue;
        if (needle) {
            const hay = `${entry.msg} ${entry.context ?? ''}`.toLowerCase();
            if (!hay.includes(needle)) continue;
        }
        out.push(entry);
    }
    return out;
};
