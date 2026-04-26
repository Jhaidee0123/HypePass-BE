/**
 * Tiny CSV serializer. Escapes per RFC 4180:
 * - wrap fields in quotes when they contain commas, newlines, or quotes
 * - double internal quotes
 * - undefined/null → empty
 */

const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    let s = typeof val === 'string' ? val : String(val);
    if (val instanceof Date) s = val.toISOString();
    if (/[",\n\r]/.test(s)) {
        s = `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

export const toCsv = (
    headers: string[],
    rows: Array<Record<string, unknown>>,
): string => {
    const head = headers.map(escape).join(',');
    const body = rows
        .map((row) => headers.map((h) => escape(row[h])).join(','))
        .join('\n');
    return `${head}\n${body}\n`;
};
