import {bisector, sort} from 'd3-array';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';

import type {ChartSeriesData, MeaningfulAny, TooltipDataChunk} from '../../types';
import type {PreparedSeries} from '../series/types';

export interface ShapePoint {
    x: number;
    y0: number;
    y1: number;
    color?: string;
    percentage?: number;
    data: ChartSeriesData;
    series: PreparedSeries;
    subTotal?: number;
    sourceX?: number;
    /**
     * Pixel distance from the pointer to the drawn shape of the series this point belongs to;
     * `0` when the pointer is inside it, `undefined` when it was not measured.
     */
    distance?: number;
    /**
     * Distance to the painted contour of this point and its paint order among the points of
     * its group; set by plugins whose shapes of one X column overlap (bar overlays).
     */
    hitTest?: {distance: number; priority: number};
}

/**
 * Tooltip chunk produced by a series plugin, together with the pixel distance from the
 * pointer to the drawn shape of the chunk: `0` when the pointer is inside the shape,
 * `undefined` when it was not measured. Only the `closest` chunk needs a distance. It is used
 * to pick a single active chunk across series types and is stripped before the chunks reach
 * public callbacks.
 */
export type TooltipCandidate = TooltipDataChunk & {distance?: number};

export interface GetTooltipDataArgs<TShapeData = unknown> {
    data: TShapeData[];
    position: [number, number];
    boundsWidth: number;
    boundsHeight: number;
    /**
     * `false` when no other series type competes for the pointer, so `distance` is not
     * compared and the plugin must skip measuring it.
     */
    measureDistance: boolean;
}

export interface GetTooltipDataResult {
    chunks: TooltipCandidate[];
    xLookupPoints?: ShapePoint[];
}

export type GetTooltipDataFn = (args: GetTooltipDataArgs<MeaningfulAny>) => GetTooltipDataResult;

export function getClosestYIndex(items: ShapePoint[], y: number) {
    let closestYIndex = -1;
    if (y < items[0]?.y0) {
        closestYIndex = 0;
    } else if (y > items[items.length - 1]?.y1) {
        closestYIndex = items.length - 1;
    } else {
        closestYIndex = items.findIndex((p) => y > p.y0 && y < p.y1);
        if (closestYIndex === -1) {
            const sortedY = sort(
                items.map((p, index) => ({index, y: p.y1 + (p.y0 - p.y1) / 2})),
                (p) => p.y,
            );
            const sortedYIndex = bisector<{y: number}, number>((p) => p.y).center(sortedY, y);
            closestYIndex = sortedY[sortedYIndex]?.index ?? -1;
        }
    }

    return closestYIndex;
}

/** Index of the render layer of each series by series id; a higher index is drawn above. */
export type LayerIndexes = Map<string, number>;

export function getSeriesLayer(layerIndexes: LayerIndexes | undefined, series: object) {
    return layerIndexes?.get(get(series, 'id', '')) ?? -1;
}

/**
 * Picks the active point among the candidates of one X column. When the distances to the
 * drawn shapes are measured, the nearest shape wins, then the series drawn in the upper
 * layer; the remaining ties and unmeasured candidates are resolved by the Y rule of
 * `getClosestYIndex`.
 */
function pickClosestPoint(points: ShapePoint[], y: number, layerIndexes?: LayerIndexes) {
    let candidates = points;
    const measured = points.filter((p) => p.distance !== undefined);
    if (measured.length > 0) {
        const min = Math.min(...measured.map((p) => p.distance as number));
        candidates = measured.filter((p) => p.distance === min);
        if (candidates.length > 1 && layerIndexes) {
            const layers = candidates.map((p) => getSeriesLayer(layerIndexes, p.series));
            const top = Math.max(...layers);
            candidates = candidates.filter((_p, index) => layers[index] === top);
        }
    }
    const sorted = sort(candidates, (p) => p.y0);
    const index = getClosestYIndex(sorted, y);
    return sorted[index === -1 ? 0 : index];
}

/**
 * Picks the active point among candidates with per-point hit tests (overlapping bars):
 * the nearest contour wins, then the later painted one. Points without a hit test use the
 * measured distance of their series or the distance to their point.
 */
function getClosestHitTestPoint(points: ShapePoint[], x: number, y: number) {
    let shapeWinner: ShapePoint | undefined;
    let candidates: ShapePoint[] = [];
    let closestDistance = Infinity;
    for (const point of points) {
        const distance =
            point.hitTest?.distance ??
            point.distance ??
            Math.hypot(
                (point.sourceX ?? point.x) - x,
                Math.max(Math.min(point.y0, point.y1) - y, y - Math.max(point.y0, point.y1), 0),
            );
        if (distance < closestDistance) {
            candidates = [];
            shapeWinner = undefined;
            closestDistance = distance;
        }
        if (distance !== closestDistance) continue;
        if (point.hitTest) {
            if (point.hitTest.priority > (shapeWinner?.hitTest?.priority ?? -Infinity)) {
                shapeWinner = point;
            }
        } else {
            candidates.push(point);
        }
    }
    if (shapeWinner) candidates.push(shapeWinner);
    // Paint order is comparable only among hit-tested shapes. Preserve Y selection
    // for mixed candidates, including a line point at the edge of a bar.
    const sorted = sort(candidates, (point) => point.y0);
    return sorted[getClosestYIndex(sorted, y)] ?? points[0];
}

export function getClosestPointsByXValue(
    x: number,
    y: number,
    points: ShapePoint[],
    layerIndexes?: LayerIndexes,
): Array<ShapePoint & {closest: boolean}> {
    const sorted = sort(points, (p) => p.x);
    const closestXIndex = bisector<ShapePoint, number>((p) => p.x).center(sorted, x);

    if (sorted.length === 0 || closestXIndex === -1) {
        return [];
    }

    const closestX = Math.round(sorted[closestXIndex].x);
    const filtered = points.filter((p) => Math.round(p.x) === closestX);

    const groupedBySeries = Object.values(groupBy(filtered, (p) => get(p.series, 'id'))).map(
        (items) => {
            if (items.some((point) => point.hitTest)) {
                return getClosestHitTestPoint(items, x, y);
            }
            const sortedByY = sort(items, (p) => p.y0);
            const index = getClosestYIndex(sortedByY, y);
            return sortedByY[index === -1 ? 0 : index];
        },
    );

    const closestPoints = sort(groupedBySeries, (p) => p.y0);

    if (closestPoints.some((p) => p.hitTest)) {
        const winner = getClosestHitTestPoint(closestPoints, x, y);
        return closestPoints.map((point) => ({...point, closest: point === winner}));
    }

    const pointsWithSourceX = closestPoints.filter((p) => p.sourceX !== undefined);
    const uniqueSourceX = new Set(pointsWithSourceX.map((p) => p.sourceX));

    if (pointsWithSourceX.length > 1 && uniqueSourceX.size > 1) {
        const sortedBySourceX = sort(pointsWithSourceX, (p) => p.sourceX ?? 0);
        const closestSourceXIdx = bisector<ShapePoint, number>((p) => p.sourceX ?? 0).center(
            sortedBySourceX,
            x,
        );
        const closestSourceX = sortedBySourceX[closestSourceXIdx]?.sourceX;

        const candidates = closestPoints.filter(
            (p) => p.sourceX === undefined || p.sourceX === closestSourceX,
        );
        const winner = pickClosestPoint(candidates, y, layerIndexes);

        return closestPoints.map((p) => ({
            ...p,
            closest: p === winner,
        }));
    }

    const winner = pickClosestPoint(closestPoints, y, layerIndexes);
    return closestPoints.map((p) => ({
        ...p,
        closest: p === winner,
    }));
}

/**
 * Resolves the effective tooltip visibility for a point: point-level setting wins
 * over series-level. Both default to `true` when unset.
 */
export function isPointTooltipEnabled(args: {
    data?: {tooltip?: {enabled?: boolean}} | null;
    series?: {tooltip?: {enabled?: boolean}} | null;
}): boolean {
    const pointEnabled = args.data?.tooltip?.enabled;
    if (pointEnabled !== undefined) {
        return pointEnabled;
    }
    return args.series?.tooltip?.enabled ?? true;
}

export function isInsidePath(args: {
    path: string;
    point: [number, number];
    width: number;
    height: number;
    strokeWidth: number;
}) {
    const {path, point, width, height, strokeWidth} = args;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.lineWidth = strokeWidth;
        const path2D = new Path2D(path);
        ctx.stroke(path2D);
        return ctx.isPointInPath(path2D, ...point) || ctx.isPointInStroke(path2D, ...point);
    }

    return null;
}

let hitTestContext: CanvasRenderingContext2D | null | undefined;

/**
 * Whether the point lies inside the fill of the SVG path. Falls back to `true` where the
 * canvas is unavailable (for example, in jsdom).
 */
export function isPointInFill(path: string, point: [number, number]) {
    if (hitTestContext === undefined) {
        hitTestContext =
            typeof document === 'undefined'
                ? null
                : document.createElement('canvas').getContext('2d');
    }
    if (!hitTestContext) {
        return true;
    }
    return hitTestContext.isPointInPath(new Path2D(path), point[0], point[1]);
}

export function getRadius(args: {pointer: [number, number]; center: [number, number]}) {
    const {pointer, center} = args;
    const x = pointer[0] - center[0];
    const y = pointer[1] - center[1];
    return Math.sqrt(x * x + y * y);
}
