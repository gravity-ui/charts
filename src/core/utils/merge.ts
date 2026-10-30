import mergeWith from 'es-toolkit/compat/mergeWith';

function isPlainContainer(value: unknown): value is object {
    if (Array.isArray(value)) {
        return true;
    }
    if (value === null || typeof value !== 'object') {
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

// Whether one plain object or array sits at several paths. A cycle back to an ancestor is not
// sharing: es-toolkit handles cycles itself.
function hasSharedPaths(value: unknown, seen: Set<object>, ancestors: Set<object>): boolean {
    if (!isPlainContainer(value) || ancestors.has(value)) {
        return false;
    }
    if (seen.has(value)) {
        return true;
    }
    seen.add(value);
    ancestors.add(value);
    const shared = ownEnumerableKeys(value).some((key) =>
        hasSharedPaths((value as Record<PropertyKey, unknown>)[key], seen, ancestors),
    );
    ancestors.delete(value);
    return shared;
}

// Copies plain objects and arrays so that every path gets an object of its own. Other values,
// such as functions, dates or class instances, stay as they are, as do cycles.
function copyPaths(value: unknown, ancestors: Set<object>): unknown {
    if (!isPlainContainer(value) || ancestors.has(value)) {
        return value;
    }
    const copy: Record<PropertyKey, unknown> = Array.isArray(value)
        ? new Array(value.length)
        : Object.create(Object.getPrototypeOf(value));
    ancestors.add(value);
    for (const key of ownEnumerableKeys(value)) {
        copy[key] = copyPaths((value as Record<PropertyKey, unknown>)[key], ancestors);
    }
    ancestors.delete(value);
    return copy;
}

// Where es-toolkit's merge differs from lodash's, returns the value lodash would put in place.
function mergeValue(target: unknown, source: unknown): unknown {
    if (source === null || typeof source !== 'object' || ArrayBuffer.isView(source)) {
        return undefined;
    }
    // Lodash puts a Date, a Map, a class instance or another non-plain object in place as it is;
    // es-toolkit merges it into a plain object of the target, which loses it.
    if (!isPlainContainer(source)) {
        return source;
    }
    // In place of a function, es-toolkit puts the source object itself, so that a later source
    // changes the user's object; lodash merges it into a new one.
    if (typeof target === 'function') {
        return mergeWith(Array.isArray(source) ? [] : {}, source, mergeValue);
    }
    return undefined;
}

// es-toolkit remembers merged objects across all sources of one call, so sharing between sources
// counts too.
function unshare(sources: unknown[]) {
    const seen = new Set<object>();
    const shared = sources.some((source) => hasSharedPaths(source, seen, new Set()));
    return shared ? sources.map((source) => copyPaths(source, new Set())) : sources;
}

/**
 * es-toolkit's merge from the compat layer, for user options. When one object of the sources sits
 * at several paths, es-toolkit merges it once and reuses that result for the other paths: an
 * options object shared by two series types would get the defaults of the first type. Such sources
 * are copied first, so every path is merged on its own, as lodash did. Other objects of a source,
 * such as dates or class instances, replace the target value, as in lodash.
 */
export function merge<T, U>(object: T, source: U): T & U;
export function merge<T, U, V>(object: T, source1: U, source2: V): T & U & V;
export function merge<T, U, V, W>(object: T, source1: U, source2: V, source3: W): T & U & V & W;
export function merge(object: unknown, ...sources: unknown[]) {
    return mergeWith(object, ...unshare(sources), mergeValue);
}
