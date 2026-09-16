import type {CurveFactory} from 'd3-shape';
import {line as lineGenerator} from 'd3-shape';

import type {
    HtmlItem,
    LabelData,
    LineSeriesDataLabelPlacementPosition,
    ShapeDataWithLabels,
} from '../../../types';
import type {PreparedLineSeries} from '../../series/types';
import {
    getFormattedValue,
    getLabelsSize,
    getLeftPosition,
    getTextSizeFn,
    isPointDataLabelEnabled,
} from '../../utils';

import type {PointData} from './types';

export const DEFAULT_PLACEMENT_ORDER: readonly LineSeriesDataLabelPlacementPosition[] = [
    'top',
    'bottom',
    'left',
    'right',
];

/** Expands the `auto` placement into the built-in position order */
export function getPlacementPositions(
    placement: 'auto' | LineSeriesDataLabelPlacementPosition[],
): readonly LineSeriesDataLabelPlacementPosition[] {
    return placement === 'auto' ? DEFAULT_PLACEMENT_ORDER : placement;
}

/**
 * Returns `true` when placing the series labels requires the candidate checks
 * (intersections with lines and other labels): the series has more than one
 * candidate position, or it hides the labels that do not fit.
 *
 * Returns `false` when the result is predetermined — a single position with the
 * `show` fallback always draws the label at that position shifted into the plot,
 * so the checks (and the segments/obstacles they consume) can be skipped.
 */
export function needsPlacementChecks(series: PreparedLineSeries): boolean {
    const positions = getPlacementPositions(series.dataLabels.placement);
    return positions.length > 1 || series.dataLabels.placementFallback === 'hide';
}

/**
 * Area available for labels, in plot pixel coordinates: x ∈ [0, xMax], y ∈ [yTop, yBottom].
 * With split plots these are the limits of the series' own plot.
 */
export interface PlacementBounds {
    xMax: number;
    yBottom: number;
    yTop: number;
}

/**
 * Axis-aligned label box in plot pixel coordinates, positioned by its top-left corner.
 * Represents both a placement candidate and an obstacle (an already placed label).
 */
export interface PlacementRect {
    height: number;
    width: number;
    /** Left edge */
    x: number;
    /** Top edge */
    y: number;
}

/**
 * A straight piece of a drawn line between two adjacent points, used as an obstacle:
 * `(x1, y1) → (x2, y2)` are the segment ends, `xMin/xMax/yMin/yMax` — its precomputed
 * bounding box for the cheap intersection reject.
 */
export interface PlacementSegment {
    /** Half of the line stroke width — the rect is inflated by it on intersection checks */
    halfWidth: number;
    x1: number;
    x2: number;
    xMax: number;
    xMin: number;
    y1: number;
    y2: number;
    yMax: number;
    yMin: number;
}

/** Mirrors the d3 line `defined()` predicate from the line renderer */
function isDrawnPoint(p: PointData): p is PointData & {x: number; y: number} {
    return p.x !== null && p.y !== null && !p.hiddenInLine;
}

function makeSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    halfWidth: number,
): PlacementSegment {
    return {
        halfWidth,
        x1,
        x2,
        xMax: Math.max(x1, x2),
        xMin: Math.min(x1, x2),
        y1,
        y2,
        yMax: Math.max(y1, y2),
        yMin: Math.min(y1, y2),
    };
}

/** Number of straight pieces a Bézier curve is flattened into */
const CURVE_STEPS = 8;

/**
 * Drawing context for d3 curves that records the drawn path as straight segments,
 * flattening Bézier curves by sampling. Lets the obstacles follow the rendered
 * interpolated line instead of the chords between the data points.
 */
class SegmentCollector {
    readonly segments: PlacementSegment[] = [];
    private readonly halfWidth: number;
    private x = 0;
    private y = 0;

    constructor(halfWidth: number) {
        this.halfWidth = halfWidth;
    }

    moveTo(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    lineTo(x: number, y: number) {
        this.segments.push(makeSegment(this.x, this.y, x, y, this.halfWidth));
        this.x = x;
        this.y = y;
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        const {x: x0, y: y0} = this;
        for (let i = 1; i <= CURVE_STEPS; i++) {
            const t = i / CURVE_STEPS;
            const mt = 1 - t;
            this.lineTo(
                mt * mt * x0 + 2 * mt * t * cpx + t * t * x,
                mt * mt * y0 + 2 * mt * t * cpy + t * t * y,
            );
        }
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
        const {x: x0, y: y0} = this;
        for (let i = 1; i <= CURVE_STEPS; i++) {
            const t = i / CURVE_STEPS;
            const mt = 1 - t;
            const a = mt * mt * mt;
            const b = 3 * mt * mt * t;
            const c = 3 * mt * t * t;
            const d = t * t * t;
            this.lineTo(a * x0 + b * cp1x + c * cp2x + d * x, a * y0 + b * cp1y + c * cp2y + d * y);
        }
    }

    closePath() {}
}

/**
 * Segments of all visible lines in the layer. Without a curve factory these are the
 * chords between array-adjacent drawn points; with one, the line is drawn through the
 * curve exactly as the renderer does and flattened into segments.
 */
export function getLineSegments(
    data: Array<{curveFactory?: CurveFactory; lineWidth: number; points: PointData[]}>,
): PlacementSegment[] {
    const segments: PlacementSegment[] = [];
    for (const d of data) {
        const halfWidth = d.lineWidth / 2;
        if (d.curveFactory) {
            const collector = new SegmentCollector(halfWidth);
            lineGenerator<PointData>()
                .defined(isDrawnPoint)
                .x((p) => p.x as number)
                .y((p) => p.y as number)
                .curve(d.curveFactory)
                .context(collector as unknown as CanvasRenderingContext2D)(d.points);
            segments.push(...collector.segments);
            continue;
        }
        for (let i = 1; i < d.points.length; i++) {
            const p1 = d.points[i - 1];
            const p2 = d.points[i];
            if (isDrawnPoint(p1) && isDrawnPoint(p2)) {
                segments.push(makeSegment(p1.x, p1.y, p2.x, p2.y, halfWidth));
            }
        }
    }

    return segments;
}

function getCandidateRect(
    position: LineSeriesDataLabelPlacementPosition,
    point: {x: number; y: number},
    size: {height: number; width: number},
    padding: number,
): PlacementRect {
    switch (position) {
        case 'bottom':
            return {...size, x: point.x - size.width / 2, y: point.y + padding};
        case 'right':
            return {...size, x: point.x + padding, y: point.y - size.height / 2};
        case 'left':
            return {...size, x: point.x - padding - size.width, y: point.y - size.height / 2};
        case 'top':
        default:
            return {...size, x: point.x - size.width / 2, y: point.y - padding - size.height};
    }
}

/**
 * Shifts the rect into the plot bounds, reproducing the label clamping formulas of the
 * "always above the point" behavior exactly: the x clamp applies the left limit first,
 * and for SVG labels it is the hanging baseline that respects the top limit, so the
 * visible box may stick out above the plot by `hangingOffset` pixels.
 */
export function clampPlacementRect(args: {
    bounds: PlacementBounds;
    hangingOffset?: number;
    rect: PlacementRect;
}): PlacementRect {
    const {bounds, hangingOffset = 0, rect} = args;

    return {
        ...rect,
        x: Math.min(bounds.xMax - rect.width, Math.max(0, rect.x)),
        y: Math.max(bounds.yTop - hangingOffset, Math.min(bounds.yBottom - rect.height, rect.y)),
    };
}

/** Segment × rect intersection: bbox reject, then Liang-Barsky; rect is inflated by halfWidth */
export function segmentIntersectsRect(seg: PlacementSegment, rect: PlacementRect): boolean {
    const left = rect.x - seg.halfWidth;
    const right = rect.x + rect.width + seg.halfWidth;
    const top = rect.y - seg.halfWidth;
    const bottom = rect.y + rect.height + seg.halfWidth;
    if (seg.xMax < left || seg.xMin > right || seg.yMax < top || seg.yMin > bottom) {
        return false;
    }
    let t0 = 0;
    let t1 = 1;
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const p = [-dx, dx, -dy, dy];
    const q = [seg.x1 - left, right - seg.x1, seg.y1 - top, bottom - seg.y1];
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) {
                return false;
            }
            continue;
        }
        const t = q[i] / p[i];
        if (p[i] < 0) {
            if (t > t1) {
                return false;
            }
            t0 = Math.max(t0, t);
        } else {
            if (t < t0) {
                return false;
            }
            t1 = Math.min(t1, t);
        }
    }

    return true;
}

function rectsOverlap(a: PlacementRect, b: PlacementRect): boolean {
    return (
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
    );
}

/**
 * Picks the first position from `positions` whose label box, shifted into `bounds`,
 * does not cross any line segment or obstacle rect. Returns `null` when no candidate fits.
 */
export function pickLabelPlacement(args: {
    allowOverlap: boolean;
    bounds: PlacementBounds;
    hangingOffset?: number;
    obstacles: PlacementRect[];
    padding: number;
    point: {x: number; y: number};
    positions: readonly LineSeriesDataLabelPlacementPosition[];
    segments: PlacementSegment[];
    size: {height: number; width: number};
}): PlacementRect | null {
    for (const position of args.positions) {
        const rect = clampPlacementRect({
            bounds: args.bounds,
            hangingOffset: args.hangingOffset,
            rect: getCandidateRect(position, args.point, args.size, args.padding),
        });
        if (args.segments.some((s) => segmentIntersectsRect(s, rect))) {
            continue;
        }
        if (!args.allowOverlap && args.obstacles.some((o) => rectsOverlap(o, rect))) {
            continue;
        }
        return rect;
    }

    return null;
}

/**
 * Label rects of the other layers as placement obstacles. Some plugins do not fill
 * the label fields at all (layers reach here through an unsafe cast in getShapes),
 * so both lists are treated as optional.
 */
export function getObstacleRectsFromLayers(
    layers: Partial<ShapeDataWithLabels>[],
): PlacementRect[] {
    return layers.flatMap((layer) => [
        ...(layer.svgLabels ?? []).map((l) => ({
            height: l.size.height,
            width: l.size.width,
            x: getLeftPosition(l),
            y: l.y - (l.size.hangingOffset ?? 0),
        })),
        ...(layer.htmlLabels ?? []).map((l) => ({
            height: l.size.height,
            width: l.size.width,
            x: l.x,
            y: l.y,
        })),
    ]);
}

interface LabelSize {
    hangingOffset: number;
    height: number;
    width: number;
}

/**
 * Measured label sizes per series object. Every line layer places the labels of the
 * preceding series again to use them as obstacles, so without the cache each label
 * would be measured once per layer — noticeable for HTML labels, whose measurement
 * is a DOM layout. A series object lives for one render of one data set, so the cache
 * never goes stale.
 */
const labelSizeCache = new WeakMap<PreparedLineSeries, Map<string, LabelSize>>();

async function measureLabel(
    series: PreparedLineSeries,
    text: string,
    getTextSize: ReturnType<typeof getTextSizeFn>,
): Promise<LabelSize> {
    let cache = labelSizeCache.get(series);
    if (!cache) {
        cache = new Map();
        labelSizeCache.set(series, cache);
    }
    const cached = cache.get(text);
    if (cached) {
        return cached;
    }

    let size: LabelSize;
    if (series.dataLabels.html) {
        const labelSize = await getLabelsSize({
            labels: [text],
            style: series.dataLabels.style,
            html: true,
        });
        size = {hangingOffset: 0, height: labelSize.maxHeight, width: labelSize.maxWidth};
    } else {
        const labelSize = await getTextSize(text);
        size = {
            hangingOffset: labelSize.hangingOffset,
            height: labelSize.height,
            width: labelSize.width,
        };
    }
    cache.set(text, size);

    return size;
}

/**
 * Places the labels of a line series: formats and measures each label, tries the
 * configured positions (each shifted into the plot bounds) and applies the
 * `placementFallback` when none fits, then converts the resulting rect into render
 * items. Every placed label rect is pushed into `args.obstacles`, so subsequent
 * labels avoid it.
 *
 * With a single position and the `show` fallback the outcome is predetermined —
 * the first position shifted into the plot — so the checks are skipped entirely.
 * This is both the fast path and the exact reproduction of the default
 * "always above the point" behavior.
 */
export async function placeLineDataLabels(args: {
    bounds: PlacementBounds;
    isOutsideBounds: (x: number, y: number) => boolean;
    obstacles: PlacementRect[];
    points: PointData[];
    segments: PlacementSegment[];
    series: PreparedLineSeries;
}): Promise<{htmlLabels: HtmlItem[]; svgLabels: LabelData[]}> {
    const {bounds, isOutsideBounds, obstacles, points, segments, series} = args;
    const htmlLabels: HtmlItem[] = [];
    const svgLabels: LabelData[] = [];

    const fallback = series.dataLabels.placementFallback;
    const positions = getPlacementPositions(series.dataLabels.placement);
    const needChecks = needsPlacementChecks(series);

    const getTextSize = getTextSizeFn({style: series.dataLabels.style});

    for (const point of points) {
        if (point.x === null || point.y === null || isOutsideBounds(point.x, point.y)) {
            continue;
        }

        if (!isPointDataLabelEnabled({data: point.data, series})) {
            continue;
        }

        const anchor = {x: point.x, y: point.y};

        const text = getFormattedValue({
            value: point.data.label ?? point.data.y,
            ...series.dataLabels,
        });

        const {hangingOffset, height, width} = await measureLabel(series, text, getTextSize);
        const size = {height, width};

        let rect: PlacementRect | null = null;
        if (needChecks) {
            rect = pickLabelPlacement({
                allowOverlap: series.dataLabels.allowOverlap,
                bounds,
                hangingOffset,
                obstacles,
                padding: series.dataLabels.padding,
                point: anchor,
                positions,
                segments,
                size,
            });
        }
        if (!rect && (!needChecks || fallback === 'show')) {
            rect = clampPlacementRect({
                bounds,
                hangingOffset,
                rect: getCandidateRect(positions[0], anchor, size, series.dataLabels.padding),
            });
        }

        if (!rect) {
            continue;
        }

        obstacles.push(rect);

        if (series.dataLabels.html) {
            htmlLabels.push({
                content: text,
                size,
                style: series.dataLabels.style,
                x: rect.x,
                y: rect.y,
            });
        } else {
            svgLabels.push({
                active: true,
                series,
                size: {...size, hangingOffset},
                style: series.dataLabels.style,
                text,
                textAnchor: 'start',
                x: rect.x,
                y: rect.y + hangingOffset,
            });
        }
    }

    return {htmlLabels, svgLabels};
}
