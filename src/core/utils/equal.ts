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

function isPlainObject(value: object) {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

// es-toolkit picks the comparison by Symbol.toStringTag, so two objects with a custom tag are
// never equal, and a plain object tagged 'DataView' is compared as a view. Lodash hid the tag by
// setting it to undefined for a moment and compared the fields, as this does. It could hide only a
// writable field, such as an own one or the one decimal.js puts on Decimal.prototype; objects with
// a getter or a read-only tag, as built-in objects have, are left to es-toolkit, as lodash left them
// unequal.
function isComparedByFields(value: unknown): value is Record<PropertyKey, unknown> {
    if (value === null || typeof value !== 'object' || !(Symbol.toStringTag in value)) {
        return false;
    }
    for (let owner: object | null = value; owner; owner = Object.getPrototypeOf(owner)) {
        const descriptor = Object.getOwnPropertyDescriptor(owner, Symbol.toStringTag);
        if (descriptor) {
            // An inherited tag is hidden by an own field, which needs an extensible object.
            return descriptor.writable === true && (owner === value || Object.isExtensible(value));
        }
    }
    return false;
}

function ownEnumerableKeys(value: object) {
    return Reflect.ownKeys(value).filter((key) =>
        Object.prototype.propertyIsEnumerable.call(value, key),
    );
}

// The pairs being compared further up, from each side, to stop at cycles as lodash does.
interface Comparing {
    left: Map<object, object>;
    right: Map<object, object>;
}

function compareFields(
    x: Record<PropertyKey, unknown>,
    y: Record<PropertyKey, unknown>,
    comparing: Comparing,
) {
    // Like lodash, objects of different classes are not equal.
    if (
        !(isPlainObject(x) && isPlainObject(y)) &&
        Object.getPrototypeOf(x) !== Object.getPrototypeOf(y)
    ) {
        return false;
    }
    const left = comparing.left.get(x);
    const right = comparing.right.get(y);
    if (left !== undefined || right !== undefined) {
        return left === y && right === x;
    }
    comparing.left.set(x, y);
    comparing.right.set(y, x);
    const keys = ownEnumerableKeys(x);
    // Values are compared inside an array: es-toolkit compares top-level Maps and Sets in insertion
    // order, nested ones in any order, as lodash does.
    const result =
        keys.length === ownEnumerableKeys(y).length &&
        keys.every(
            (key) =>
                Object.prototype.propertyIsEnumerable.call(y, key) &&
                compare([x[key]], [y[key]], comparing),
        );
    comparing.left.delete(x);
    comparing.right.delete(y);
    return result;
}

function compare(a: unknown, b: unknown, comparing: Comparing): boolean {
    return isEqualWith(a, b, (x, y) => {
        if (isDataView(x) && isDataView(y)) {
            return isSameDataView(x, y);
        }
        if (isComparedByFields(x) && isComparedByFields(y)) {
            return compareFields(x, y, comparing);
        }
        return undefined;
    });
}

/**
 * Deep equality for user data, as lodash's isEqual compared it. es-toolkit's isEqual differs for
 * DataViews, which it treats as equal when they have the same length, and for objects with a
 * custom Symbol.toStringTag.
 */
export function isDataEqual(a: unknown, b: unknown): boolean {
    return compare(a, b, {left: new Map(), right: new Map()});
}
