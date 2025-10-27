export function getMinSpaceBetween<T>(arr: T[], iterator: (item: T) => number) {
    if (arr.length < 2) {
        return 0;
    }

    return arr.reduce((acc, item, index) => {
        const prev = arr[index - 1];
        if (prev) {
            return Math.min(acc, Math.abs(iterator(prev) - iterator(item)));
        }
        return acc;
    }, Infinity);
}
