import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSplit} from '../layout/split-types';
import type {ChartScale, ChartScaleLinear} from '../scales/types';
import type {PreparedSeries} from '../series/types';
import type {LinearGradient} from '../types';

import {isBandScale} from './axis/common';
import type {GradientCoords} from './gradient';
import {getGradientBBox, gradientAngleToCoords} from './gradient';

export interface ShapeDataReference {
    boundsWidth: number;
    boundsHeight: number;
    series: PreparedSeries[];
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    split: PreparedSplit;
}

interface GradientPoint {
    data: object;
    x: number | null;
    y: number | null;
    hiddenInLine?: boolean;
}

interface ReferencePoint {
    x: number;
    y: number;
}

interface ReferenceGradient {
    coords: GradientCoords;
    points: Map<object, ReferencePoint[]>;
    xScale: ChartScale;
    yScale: ChartScale;
    yAxisTop: number;
}

export interface SeriesGradientState {
    paints: Map<'stroke' | 'fill', ReferenceGradient>;
}

interface ScaleTransform {
    ratio: number;
    offset: number;
}

function getScaleTransform(source: ChartScale, target: ChartScale): ScaleTransform {
    const sourceRange = source.range();
    const targetRange = target.range();
    if (isBandScale(source) && isBandScale(target)) {
        const sourceDirection = Math.sign(sourceRange[1] - sourceRange[0]);
        const targetDirection = Math.sign(targetRange[1] - targetRange[0]);
        const ratio = (target.step() * targetDirection) / (source.step() * sourceDirection);
        const category = target.domain()[0];
        const sourcePosition = (source(category) ?? 0) + source.step() / 2;
        const targetPosition = (target(category) ?? 0) + target.step() / 2;
        return {ratio, offset: targetPosition - ratio * sourcePosition};
    }
    const [min, max] = source.domain();
    const scale = target as ChartScaleLinear;
    const start = scale(Number(min));
    const ratio = (scale(Number(max)) - start) / (sourceRange[1] - sourceRange[0]);
    return {ratio, offset: start - ratio * sourceRange[0]};
}

/** Resolve a paint against the complete series, then transport its color field through axis scaling. */
export function prepareGradientCoords(args: {
    gradient?: LinearGradient;
    state?: SeriesGradientState;
    paint: 'stroke' | 'fill';
    points: GradientPoint[];
    xScale: ChartScale;
    yScale: ChartScale;
    yAxisTop?: number;
}): GradientCoords | undefined {
    const {gradient, state, paint, points, xScale, yScale, yAxisTop = 0} = args;
    if (!gradient) {
        return undefined;
    }
    const bbox = getGradientBBox(points);
    if (!bbox) {
        return undefined;
    }

    const source = state?.paints.get(paint);
    if (!source) {
        const coords = gradientAngleToCoords(gradient.angle ?? 180, bbox);
        if (!state) {
            return coords;
        }
        const referencePoints = new Map<object, ReferencePoint[]>();
        for (const point of points) {
            if (point.x === null || point.y === null) {
                continue;
            }
            const locations = referencePoints.get(point.data) ?? [];
            locations.push({x: point.x, y: point.y});
            referencePoints.set(point.data, locations);
        }
        state.paints.set(paint, {coords, points: referencePoints, xScale, yScale, yAxisTop});
        return coords;
    }

    if (source.xScale === xScale && source.yScale === yScale && source.yAxisTop === yAxisTop) {
        return source.coords;
    }

    const transformX = getScaleTransform(source.xScale, xScale);
    const transformY = getScaleTransform(source.yScale, yScale);
    transformY.offset += yAxisTop - transformY.ratio * source.yAxisTop;

    const {x1, y1, x2, y2} = source.coords;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        const point = points.find((p) => p.x !== null && p.y !== null);
        if (!point || point.x === null || point.y === null) {
            return undefined;
        }
        return {x1: point.x, y1: point.y, x2: point.x, y2: point.y};
    }

    let anchor = {
        original: {x: x1, y: y1},
        current: {
            x: transformX.ratio * x1 + transformX.offset,
            y: transformY.ratio * y1 + transformY.offset,
        },
    };

    // A single-value axis can use a special scale for clipping neighbors.
    // Recover its actual transform from the prepared point coordinates.
    if (!transformX.ratio || !transformY.ratio) {
        const occurrences = new Map<object, number>();
        const pairs = points.flatMap((point) => {
            const occurrence = occurrences.get(point.data) ?? 0;
            occurrences.set(point.data, occurrence + 1);
            const original = source.points.get(point.data)?.[occurrence];
            return original && point.x !== null && point.y !== null && !point.hiddenInLine
                ? [{original, current: {x: point.x, y: point.y}}]
                : [];
        });
        const matchedAnchor = pairs[0];
        if (!matchedAnchor) {
            return undefined;
        }
        anchor = matchedAnchor;

        const getRatio = (axis: 'x' | 'y', fallback: number) => {
            let min = anchor;
            let max = anchor;
            for (const pair of pairs) {
                if (pair.original[axis] < min.original[axis]) {
                    min = pair;
                }
                if (pair.original[axis] > max.original[axis]) {
                    max = pair;
                }
            }
            if (max.original[axis] === min.original[axis]) {
                return fallback;
            }
            return (
                (max.current[axis] - min.current[axis]) / (max.original[axis] - min.original[axis])
            );
        };
        if (!transformX.ratio) {
            transformX.ratio = getRatio('x', 0);
        }
        if (!transformY.ratio) {
            transformY.ratio = getRatio('y', 0);
        }
    }

    const ratioX = transformX.ratio;
    const ratioY = transformY.ratio;
    // t = dot(p - start, direction) / |direction|². Under axis scaling,
    // its coefficients divide by the respective scale ratios (inverse transpose).
    // Transforming the endpoints directly would change colors for oblique gradients.
    let nx = ratioX && Number.isFinite(ratioX) ? dx / lengthSquared / ratioX : 0;
    let ny = ratioY && Number.isFinite(ratioY) ? dy / lengthSquared / ratioY : 0;
    if (nx === 0 && ny === 0) {
        // A collapsed axis has a constant color along the remaining path.
        if (dy === 0) {
            nx = 1;
        } else {
            ny = 1;
        }
    }
    const normalSquared = nx * nx + ny * ny;
    const t = ((anchor.original.x - x1) * dx + (anchor.original.y - y1) * dy) / lengthSquared;
    const nextDx = nx / normalSquared;
    const nextDy = ny / normalSquared;
    const startX = anchor.current.x - t * nextDx;
    const startY = anchor.current.y - t * nextDy;
    return {x1: startX, y1: startY, x2: startX + nextDx, y2: startY + nextDy};
}
