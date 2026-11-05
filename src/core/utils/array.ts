/**
 * Groups items by key. The result has no prototype, so every key, `'__proto__'` included,
 * becomes a group of its own: es-toolkit's groupBy drops that one.
 */
export function groupBy<T>(items: readonly T[], getKey: (item: T) => unknown): Record<string, T[]> {
    const groups: Record<string, T[]> = Object.create(null);
    for (const item of items) {
        const key = String(getKey(item));
        (groups[key] ??= []).push(item);
    }
    return groups;
}

export function getMinSpaceBetween<T>(arr: T[], iterator: (item: T) => number) {
    if (arr.length < 2) {
        return 0;
    }

    return arr.reduce((acc, item, index) => {
        const prev = arr[index - 1];
        if (prev !== undefined && prev !== null) {
            return Math.min(acc, Math.abs(iterator(prev) - iterator(item)));
        }
        return acc;
    }, Infinity);
}
