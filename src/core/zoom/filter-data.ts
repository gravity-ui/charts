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
    axes?: 'x' | 'y' | 'xy';
    mode?: 'points' | 'path';
}

function spansRange(from: AxisDomainValue, to: AxisDomainValue, axis: DomainAxis) {
    if (!axis.range || from === null || from === undefined || to === null || to === undefined)
        return false;
    const [min, max] = axis.range;
    const start = Number(from);
    const end = Number(to);
    return (start < min && end > max) || (start > max && end < min);
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
                ((filterX && spansRange(getX(points[index - 1]), getX(point), viewport.x)) ||
                    (filterY &&
                        viewport.y.type !== 'category' &&
                        spansRange(getY(points[index - 1]), getY(point), viewport.y)))
            ) {
                append(index - 1);
                append(index);
            }
        }
        previousInRange = inRange;
    });
    return {data, shapeData};
}
