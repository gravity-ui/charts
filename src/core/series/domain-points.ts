import type {AxisDomainValue, DomainAxis, DomainViewport} from './plugin';

export function isValueInAxisRange(value: AxisDomainValue, axis: DomainAxis): boolean {
    if (axis.excluded) return false;
    if (!axis.range) return true;
    if (value === undefined || value === null) return false;
    const [min, max] = axis.range;
    if (axis.type === 'category') {
        const index = typeof value === 'string' ? (axis.categories ?? []).indexOf(value) : value;
        return (
            min !== -1 &&
            max !== -1 &&
            index !== -1 &&
            index >= Math.min(min, max) &&
            index <= Math.max(min, max)
        );
    }
    const numeric = Number(value);
    return numeric >= min && numeric <= max;
}

/** Preserve point-based domain selection, using retained anchors when no sample is inside. */
export function getDomainPoints<T extends {x?: AxisDomainValue; y?: AxisDomainValue}>(
    points: readonly T[],
    viewport?: DomainViewport,
    options: {
        axes?: 'x' | 'xy';
        isYInRange?: (point: T, range: readonly [number, number]) => boolean;
    } = {},
): readonly T[] {
    if (!viewport) return points;
    const selected = points.filter(
        (point) =>
            isValueInAxisRange(point.x, viewport.x) &&
            (options.axes === 'x' ||
                !viewport.y.range ||
                (options.isYInRange
                    ? options.isYInRange(point, viewport.y.range)
                    : isValueInAxisRange(point.y, viewport.y))),
    );
    return selected.length ? selected : points;
}
