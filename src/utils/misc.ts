export function randomString(length: number, chars: string) {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

export function getUniqId() {
    return `gravity-chart.${randomString(5, '0123456789abcdefghijklmnopqrstuvwxyz')}`;
}

/**
 * Checks Macintosh hardware is used.
 *
 * Note: there is no better way to get this information as using depricated property `navigator.platform`.
 *
 * More details [here](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples).
 */
export function isMacintosh() {
    return typeof navigator === 'undefined' ? false : /Mac|iP(hone|[oa]d)/.test(navigator.platform);
}

export function measurePerformance() {
    const timestamp = performance.now();

    return {
        end() {
            return performance.now() - timestamp;
        },
    };
}
