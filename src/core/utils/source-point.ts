const sourcePoints = new WeakMap<object, object>();

/** Keep the original point when a plugin creates data for layout or legacy callbacks. */
export function withSourcePoint<TSource extends object, TPrepared extends TSource>(
    source: TSource,
    prepared: TPrepared,
): TPrepared {
    sourcePoints.set(prepared, getSourcePoint(source));
    return prepared;
}

/** Resolve point data at public interaction boundaries without changing prepared geometry. */
export function getSourcePoint<T extends object>(point: T): T {
    return (sourcePoints.get(point) as T | undefined) ?? point;
}
