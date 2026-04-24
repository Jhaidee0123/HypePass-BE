/**
 * True if two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Touching boundaries (aEnd === bStart) do NOT count as overlap — a
 * previous phase can end at the exact instant the next one starts.
 */
export function rangesOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
): boolean {
    return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}
