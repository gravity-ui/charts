import isEqualWith from 'es-toolkit/compat/isEqualWith';

// By tag rather than instanceof, so that views from another realm, such as an iframe, match too.
function isDataView(value: unknown): value is DataView {
    return Object.prototype.toString.call(value) === '[object DataView]';
}

// The same check as lodash: equal length and offset, and equal bytes in the whole buffer.
function isSameDataView(a: DataView, b: DataView) {
    if (a.byteLength !== b.byteLength || a.byteOffset !== b.byteOffset) {
        return false;
    }
    const x = new Uint8Array(a.buffer);
    const y = new Uint8Array(b.buffer);
    return x.length === y.length && x.every((byte, i) => byte === y[i]);
}

/**
 * Deep equality for user data. es-toolkit's isEqual treats DataViews of the same length as equal,
 * so a new view with other bytes in `custom` would look unchanged; this compares them as lodash did.
 */
export function isDataEqual(a: unknown, b: unknown): boolean {
    return isEqualWith(a, b, (x, y) =>
        isDataView(x) && isDataView(y) ? isSameDataView(x, y) : undefined,
    );
}
