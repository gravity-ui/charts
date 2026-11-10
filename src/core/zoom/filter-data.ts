import get from 'es-toolkit/compat/get';

import type {AxisDomainValue, DomainAxis, DomainViewport} from '../series/axis-contract';
import {isValueInAxisRange} from '../series/domain-points';

export interface SeriesDataSelection<TPoint = unknown> {
    data: readonly TPoint[];
    /** Additional original points needed to draw geometry crossing a viewport edge. */
    shapeData?: readonly TPoint[];
}

export interface FilterSeriesDataArgs<TSeries> {
    series: TSeries;
    viewport: DomainViewport;
}

interface FilterPointsOptions<TPoint> {
    getX?(point: TPoint): AxisDomainValue;
    getY?(point: TPoint): AxisDomainValue;
    isXInRange?(point: TPoint, axis: DomainAxis): boolean;
    isYInRange?(point: TPoint, axis: DomainAxis): boolean;
    /** Override the Y extent check for interval-valued points. */
    overlapsYRange?(from: TPoint, to: TPoint, axis: DomainAxis): boolean;
    /** Whether this point can form a path segment with an adjacent defined point. */
    isDefined?(point: TPoint): boolean;
    axes?: 'x' | 'y' | 'xy';
    mode?: 'points' | 'path';
}

function spansRange(from: AxisDomainValue, to: AxisDomainValue, axis: DomainAxis) {
    if (!axis.range || from === null || from === undefined || to === null || to === undefined)
        return false;
    const [min, max] = axis.range;
    if (min > max) return false;
    const start = Number(from);
    const end = Number(to);
    return (start < min && end > max) || (start > max && end < min);
}

function overlapsRange(from: AxisDomainValue, to: AxisDomainValue, axis: DomainAxis) {
    if (!axis.range) return true;
    if (from === null || from === undefined || to === null || to === undefined) return false;
    const [min, max] = axis.range;
    if (min > max) return false;
    const coordinate = (value: AxisDomainValue) =>
        axis.type === 'category' && typeof value === 'string'
            ? (axis.categories ?? []).indexOf(value)
            : Number(value);
    const start = coordinate(from);
    const end = coordinate(to);
    return (
        (axis.type !== 'category' || (start !== -1 && end !== -1)) &&
        Math.min(start, end) <= max &&
        Math.max(start, end) >= min
    );
}

/** Select scalar samples, optionally retaining path neighbors and crossing segments. */
export function filterPoints<TPoint>(
    points: readonly TPoint[],
    viewport: DomainViewport,
    options: FilterPointsOptions<TPoint> = {},
): SeriesDataSelection<TPoint> {
    const getX = options.getX ?? ((point: TPoint): AxisDomainValue => get(point, 'x'));
    const getY = options.getY ?? ((point: TPoint): AxisDomainValue => get(point, 'y'));
    const filterX = options.axes !== 'y';
    const filterY = options.axes !== 'x';
    const data: TPoint[] = [];
    const shapeData =
        options.mode === 'path' && viewport.x.type !== 'category' ? ([] as TPoint[]) : undefined;
    if ((filterX && viewport.x.excluded) || (filterY && viewport.y.excluded)) {
        return {data, shapeData};
    }
    let previousInRange = false;
    let lastShapePoint = -1;
    const append = (index: number) => {
        if (shapeData && index > lastShapePoint) {
            shapeData.push(points[index]);
            lastShapePoint = index;
        }
    };
    points.forEach((point, index) => {
        const inX =
            !filterX ||
            (!viewport.x.excluded &&
                (!viewport.x.range ||
                    (options.isXInRange
                        ? options.isXInRange(point, viewport.x)
                        : isValueInAxisRange(getX(point), viewport.x))));
        const inY =
            !filterY ||
            (!viewport.y.excluded &&
                (!viewport.y.range ||
                    (options.isYInRange
                        ? options.isYInRange(point, viewport.y)
                        : isValueInAxisRange(getY(point), viewport.y))));
        const inRange = Boolean(inX && inY);
        if (inRange) data.push(point);
        if (shapeData) {
            if (inRange) {
                if (index > 0 && !previousInRange) append(index - 1);
                append(index);
            } else if (previousInRange) {
                append(index);
            } else if (
                index > 0 &&
                options.isDefined?.(points[index - 1]) !== false &&
                options.isDefined?.(point) !== false &&
                ((filterX &&
                    spansRange(getX(points[index - 1]), getX(point), viewport.x) &&
                    (!filterY ||
                        !viewport.y.range ||
                        (options.overlapsYRange
                            ? options.overlapsYRange(points[index - 1], point, viewport.y)
                            : overlapsRange(getY(points[index - 1]), getY(point), viewport.y)))) ||
                    (filterY &&
                        viewport.y.type !== 'category' &&
                        spansRange(getY(points[index - 1]), getY(point), viewport.y) &&
                        (!filterX ||
                            overlapsRange(getX(points[index - 1]), getX(point), viewport.x))))
            ) {
                append(index - 1);
                append(index);
            }
        }
        previousInRange = inRange;
    });
    return {data, shapeData};
}
