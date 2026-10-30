import isEqualWith from 'es-toolkit/compat/isEqualWith';

// ArrayBuffer.isView checks for an actual view, which a Symbol.toStringTag cannot fake, and works
// for views from another realm, such as an iframe, where instanceof would not.
function isDataView(value: unknown): value is DataView {
    return (
        ArrayBuffer.isView(value) && Object.prototype.toString.call(value) === '[object DataView]'
    );
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

// es-toolkit picks the comparison by Symbol.toStringTag, so a plain object with a custom tag is
// never equal to another one, and one tagged 'DataView' is compared as a view. Lodash ignored
// the tag of plain objects and compared their fields, as this does.
function isTaggedPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
    if (value === null || typeof value !== 'object' || !(Symbol.toStringTag in value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function ownEnumerableKeys(value: object) {
    return Reflect.ownKeys(value).filter((key) =>
        Object.prototype.propertyIsEnumerable.call(value, key),
    );
}

function compare(a: unknown, b: unknown, comparing: Map<object, object>): boolean {
    return isEqualWith(a, b, (x, y) => {
        if (isDataView(x) && isDataView(y)) {
            return isSameDataView(x, y);
        }
        if (isTaggedPlainObject(x) && isTaggedPlainObject(y)) {
            // A cycle back to a pair that is being compared further up.
            if (comparing.get(x) === y) {
                return true;
            }
            comparing.set(x, y);
            const keys = ownEnumerableKeys(x);
            const result =
                keys.length === ownEnumerableKeys(y).length &&
                keys.every(
                    (key) =>
                        Object.prototype.propertyIsEnumerable.call(y, key) &&
                        compare(x[key], y[key], comparing),
                );
            comparing.delete(x);
            return result;
        }
        return undefined;
    });
}

/**
 * Deep equality for user data, as lodash's isEqual compared it. es-toolkit's isEqual differs for
 * DataViews, which it treats as equal when they have the same length, and for plain objects with
 * a Symbol.toStringTag.
 */
export function isDataEqual(a: unknown, b: unknown): boolean {
    return compare(a, b, new Map());
}
