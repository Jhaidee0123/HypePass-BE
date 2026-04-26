import { Injectable } from '@nestjs/common';
import {
    readSystemLogs,
    SystemLogEntry,
    SystemLogsQuery,
} from '../../infrastructure/streams/log-buffer';

export type SystemLogsResult = {
    items: SystemLogEntry[];
    capacity: number;
    note: string;
};

@Injectable()
export class GetSystemLogsUseCase {
    execute(query: SystemLogsQuery): SystemLogsResult {
        const items = readSystemLogs(query);
        return {
            items,
            capacity: 1000,
            note: 'In-memory ring buffer (last 1000 entries). Cleared on every restart.',
        };
    }
}
