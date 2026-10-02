import type {ChartScale, ChartScaleLinear} from '../scales/types';
import type {LinearGradient} from '../types';

import {isBandScale} from './axis/common';
import type {GradientBBox, GradientCoords} from './gradient';
import {
    DEFAULT_GRADIENT_ANGLE,
    createGradientColorResolver,
    getGradientBBox,
    gradientAngleToCoords,
} from './gradient';

export interface ProjectedGradientPoint {
    data: object;
    x: number | null;
    y: number | null;
    hiddenInLine?: boolean;
}

interface ReferencePoint {
    x: number;
    y: number;
}

interface CapturedGradient {
    bbox: GradientBBox;
    coords: GradientCoords;
    points: ProjectedGradientPoint[];
    xScale: ChartScale;
    yScale: ChartScale;
    yAxisTop: number;
}

export interface SeriesGradientState {
    stroke?: CapturedGradient | null;
    fill?: CapturedGradient | null;
}

export interface GradientGeometry {
    id: string;
    points: ProjectedGradientPoint[];
    strokeBBox: GradientBBox | null;
    fillBBox?: GradientBBox | null;
}

/** Capture only drawable full-series geometry. A missing reference never falls back to zoomed bounds. */
export function captureGradient(args: {
    gradient?: LinearGradient;
    bbox: GradientBBox | null;
    points: ProjectedGradientPoint[];
    xScale: ChartScale;
    yScale: ChartScale;
    yAxisTop: number;
}): CapturedGradient | null {
    const {gradient, bbox, points, xScale, yScale, yAxisTop} = args;
    if (!gradient || !bbox || ![xScale, yScale].every(hasDrawableRange)) {
        return null;
    }
    const coords = gradientAngleToCoords(gradient.angle ?? DEFAULT_GRADIENT_ANGLE, bbox);
    if (!Object.values(coords).every(Number.isFinite)) {
        return null;
    }
    return {bbox, coords, points, xScale, yScale, yAxisTop};
}

type PointLocations = Map<object, Array<ReferencePoint | undefined>>;

const pointLocations = new WeakMap<ProjectedGradientPoint[], PointLocations>();

function getPointLocations(points: ProjectedGradientPoint[]) {
    const cached = pointLocations.get(points);
    if (cached) return cached;
    const locations: PointLocations = new Map();
    for (const point of points) {
        const positions = locations.get(point.data) ?? [];
        if (
            point.x === null ||
            point.y === null ||
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y)
        ) {
            positions.push(undefined);
            locations.set(point.data, positions);
            continue;
        }
        positions.push({x: point.x, y: point.y});
        locations.set(point.data, positions);
    }
    pointLocations.set(points, locations);
    return locations;
}

function hasDrawableRange(scale: ChartScale) {
    const [start, end] = scale.range();
    return (
        Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end >= 0 && start !== end
    );
}

interface ScaleTransform {
    ratio: number;
    offset: number;
    affine: boolean;
}

function getScaleTransform(source: ChartScale, target: ChartScale): ScaleTransform {
    const sourceRange = source.range();
    const targetRange = target.range();
    if (isBandScale(source) && isBandScale(target)) {
        const sourceDirection = Math.sign(sourceRange[1] - sourceRange[0]);
        const targetDirection = Math.sign(targetRange[1] - targetRange[0]);
        const common = target.domain().filter((category) => source(category) !== undefined);
        const first = common[0];
        const last = common[common.length - 1];
        const sourceFirst = first === undefined ? undefined : source(first);
        const targetFirst = first === undefined ? undefined : target(first);
        const sourceLast = last === undefined ? undefined : source(last);
        const targetLast = last === undefined ? undefined : target(last);
        if (sourceFirst === undefined || targetFirst === undefined) {
            return {ratio: 0, offset: 0, affine: false};
        }
        const stepRatio = (target.step() * targetDirection) / (source.step() * sourceDirection);
        const ratio =
            sourceLast !== undefined && targetLast !== undefined && sourceLast !== sourceFirst
                ? (targetLast - targetFirst) / (sourceLast - sourceFirst)
                : stepRatio;
        const offset =
            targetFirst - ratio * sourceFirst + (target.step() - ratio * source.step()) / 2;
        const sourceSpan =
            sourceLast === undefined ? 0 : Math.round((sourceLast - sourceFirst) / source.step());
        const targetSpan =
            targetLast === undefined ? 0 : Math.round((targetLast - targetFirst) / target.step());
        const affine = common.every((category) => {
            const sourcePosition = source(category);
            const targetPosition = target(category);
            return (
                sourcePosition !== undefined &&
                targetPosition !== undefined &&
                Math.round((sourcePosition - sourceFirst) / source.step()) * targetSpan ===
                    Math.round((targetPosition - targetFirst) / target.step()) * sourceSpan
            );
        });
        return {ratio, offset, affine};
    }
    const [min, max] = source.domain();
    const scale = target as ChartScaleLinear;
    const start = scale(Number(min));
    const ratio = (scale(Number(max)) - start) / (sourceRange[1] - sourceRange[0]);
    return {ratio, offset: start - ratio * sourceRange[0], affine: true};
}

/** Project a captured full-series color field through the current axis scales. */
export function prepareGradientCoords(args: {
    gradient?: LinearGradient;
    state?: SeriesGradientState;
    paint: 'stroke' | 'fill';
    points: ProjectedGradientPoint[];
    bbox?: GradientBBox | null;
    xScale: ChartScale;
    yScale: ChartScale;
    yAxisTop?: number;
}): GradientCoords | null | undefined {
    const {gradient, state, paint, points, xScale, yScale, yAxisTop = 0} = args;
    if (!gradient) {
        return undefined;
    }
    const source = state?.[paint];
    if (source === null) {
        return null;
    }
    if (!source) {
        const bbox = args.bbox === undefined ? getGradientBBox(points) : args.bbox;
        return bbox ? gradientAngleToCoords(gradient.angle ?? DEFAULT_GRADIENT_ANGLE, bbox) : null;
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
    if (dx === 0 && dy === 0) {
        const point = points.find((p) => p.x !== null && p.y !== null);
        if (!point || point.x === null || point.y === null) {
            return null;
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
    if (!transformX.ratio || !transformY.ratio || !transformX.affine || !transformY.affine) {
        const pairs = matchPoints(points, getPointLocations(source.points));
        const matchedAnchor = pairs[0];
        if (!matchedAnchor) {
            return null;
        }
        anchor = matchedAnchor;

        if (!transformX.ratio || !transformX.affine) {
            transformX.ratio = getPointRatio(pairs, 'x');
        }
        if (!transformY.ratio || !transformY.affine) {
            transformY.ratio = getPointRatio(pairs, 'y');
        }
    }

    return transformGradient(source.coords, transformX, transformY, anchor);
}

const pointColors = new WeakMap<ProjectedGradientPoint[], Map<object, Array<string | undefined>>>();

/** Preserve sampled marker colors when compressed category domains are not affine. */
export function applyCapturedPointColors(
    points: Array<ProjectedGradientPoint & {color?: string; fill?: string}>,
    state: SeriesGradientState | undefined,
    gradient: LinearGradient | undefined,
    targetXScale: ChartScale,
    targetYScale: ChartScale,
    getSourcePoints?: (points: ProjectedGradientPoint[]) => ProjectedGradientPoint[],
) {
    const source = state?.stroke;
    if (
        !source ||
        !gradient ||
        (getScaleTransform(source.xScale, targetXScale).affine &&
            getScaleTransform(source.yScale, targetYScale).affine)
    ) {
        return;
    }
    const sourcePoints = getSourcePoints?.(source.points) ?? source.points;
    let colors = pointColors.get(sourcePoints);
    if (!colors) {
        colors = new Map();
        const getColor = createGradientColorResolver(gradient, source.bbox, source.coords);
        for (const point of sourcePoints) {
            const entries = colors.get(point.data) ?? [];
            if (point.x === null || point.y === null) {
                entries.push(undefined);
                colors.set(point.data, entries);
                continue;
            }
            entries.push(getColor(point.x, point.y));
            colors.set(point.data, entries);
        }
        pointColors.set(sourcePoints, colors);
    }
    const occurrences = new Map<object, number>();
    for (const point of points) {
        const occurrence = occurrences.get(point.data) ?? 0;
        occurrences.set(point.data, occurrence + 1);
        if (point.color === undefined) {
            point.fill = colors.get(point.data)?.[occurrence] ?? point.fill;
        }
    }
}

interface PointPair {
    original: ReferencePoint;
    current: ReferencePoint;
}

function matchPoints(points: ProjectedGradientPoint[], locations: PointLocations): PointPair[] {
    const occurrences = new Map<object, number>();
    const pairs: PointPair[] = [];
    for (const point of points) {
        const occurrence = occurrences.get(point.data) ?? 0;
        occurrences.set(point.data, occurrence + 1);
        const original = locations.get(point.data)?.[occurrence];
        if (original && point.x !== null && point.y !== null && !point.hiddenInLine) {
            pairs.push({original, current: {x: point.x, y: point.y}});
        }
    }
    return pairs;
}

function getPointRatio(pairs: PointPair[], axis: 'x' | 'y') {
    let min = pairs[0];
    let max = pairs[0];
    for (const pair of pairs) {
        if (pair.original[axis] < min.original[axis]) {
            min = pair;
        }
        if (pair.original[axis] > max.original[axis]) {
            max = pair;
        }
    }
    const extent = max.original[axis] - min.original[axis];
    return extent ? (max.current[axis] - min.current[axis]) / extent : 0;
}

function transformGradient(
    coords: GradientCoords,
    transformX: ScaleTransform,
    transformY: ScaleTransform,
    anchor: PointPair,
): GradientCoords | null {
    const {x1, y1, x2, y2} = coords;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
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
    const result = {x1: startX, y1: startY, x2: startX + nextDx, y2: startY + nextDy};
    return Object.values(result).every(Number.isFinite) ? result : null;
}
