import {isEqualWith} from 'es-toolkit/compat';

function isSameDataView(a: DataView, b: DataView) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    for (let i = 0; i < a.byteLength; i++) {
        if (a.getUint8(i) !== b.getUint8(i)) {
            return false;
        }
    }
    return true;
}

/**
 * Deep equality for user data. es-toolkit's isEqual treats DataViews of the same length as equal,
 * so a new view with other bytes in `custom` would look unchanged; this compares their bytes.
 */
export function isDataEqual(a: unknown, b: unknown): boolean {
    return isEqualWith(a, b, (x, y) =>
        x instanceof DataView && y instanceof DataView ? isSameDataView(x, y) : undefined,
    );
}
