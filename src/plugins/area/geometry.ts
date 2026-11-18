import {group} from 'd3-array';
import {area, line} from 'd3-shape';

import type {PreparedAreaSeries} from '~core/series/types';
import type {BandColumn} from '~core/shapes/area/band';
import type {AreaGeometry, PointData, PreparedAreaData} from '~core/shapes/area/types';
import {getGradientBBox} from '~core/utils/gradient';

import type {AreaSeries, SeriesInterpolation} from '../../types';

import {
    collectSections,
    evaluateAtX,
    evaluateSection,
    getZeroFractions,
    getZeroParameters,
    intervalKey,
} from './curves';
import type {CurvePoint, CurveSection} from './curves';
import {getAreaGeometryBreaks} from './zoom';

type Column = NonNullable<BandColumn>;

interface GeometryInput {
    points: readonly Pick<PointData, 'x' | 'y' | 'y0' | 'stackValue' | 'hiddenInLine'>[];
    series: Pick<AreaSeries, 'stacking' | 'interpolation'>;
}

export interface AreaGeometryOptions {
    projection?: {project: (value: number) => number; invert: (coordinate: number) => number};
    xRange?: readonly [number, number];
    yRange?: readonly [number, number];
}

export interface PreparedGeometryOptions extends AreaGeometryOptions {
    baseline: number;
    positiveDirection?: number;
    reversedX?: boolean;
}

// Render and hit-test the same mesh, subdividing toward a tenth of a CSS pixel.
// Quarter probes also catch inflection points that a midpoint alone would miss.
const MESH_TOLERANCE = 0.1;
const MAX_SUBDIVISIONS = 12;

function sampleInterval(evaluate: (t: number) => Column[], start = 0, end = 1) {
    const first = evaluate(start);
    const last = evaluate(end);
    const samples = [first];
    const subdivide = (a: number, b: number, left: Column[], right: Column[], depth: number) => {
        const middle = (a + b) / 2;
        const center = evaluate(middle);
        const needsSubdivision = [0.25, 0.5, 0.75].some((fraction) => {
            const actual = fraction === 0.5 ? center : evaluate(a + (b - a) * fraction);
            return actual.some((column, index) =>
                (['x', 'y0', 'y1'] as const).some(
                    (key) =>
                        Math.abs(
                            column[key] -
                                (left[index][key] +
                                    (right[index][key] - left[index][key]) * fraction),
                        ) > MESH_TOLERANCE,
                ),
            );
        });
        if (needsSubdivision && depth < MAX_SUBDIVISIONS) {
            subdivide(a, middle, left, center, depth + 1);
            subdivide(middle, b, center, right, depth + 1);
        } else {
            samples.push(right);
        }
    };
    subdivide(start, end, first, last, 0);
    return samples;
}

function append(columns: BandColumn[], column: Column) {
    const previous = columns[columns.length - 1];
    if (previous && previous.x === column.x) {
        if (previous.y0 === column.y0 && previous.y1 === column.y1) return;
        // A signed layer ends at one stack offset and starts at the opposite
        // offset with zero thickness. Connecting those ends would cut across layers.
        if (previous.y0 === previous.y1 && column.y0 === column.y1) columns.push(null);
    }
    columns.push(column);
}

function getPaths(columns: BandColumn[]): AreaGeometry {
    return {
        columns,
        linePath: line<BandColumn>()
            .defined((column) => column !== null)
            .x((column) => (column as Column).x)
            .y((column) => (column as Column).y1)(columns),
        areaPath: area<BandColumn>()
            .defined((column) => column !== null)
            .x((column) => (column as Column).x)
            .y0((column) => (column as Column).y0)
            .y1((column) => (column as Column).y1)(columns),
    };
}

function getEnvelope(
    grid: number[],
    sections: Map<string, CurveSection>[],
    sign: number,
    interpolation: SeriesInterpolation,
    project: (value: number) => number,
    percent: boolean,
) {
    const points: CurvePoint[] = [];
    for (let i = 0; i < grid.length; i++) {
        const before = i > 0 ? intervalKey(grid[i - 1], grid[i]) : undefined;
        const after = i < grid.length - 1 ? intervalKey(grid[i], grid[i + 1]) : undefined;
        const total = (key: string | undefined, endpoint: 'from' | 'to') =>
            sections.reduce((sum, map) => {
                const section = key === undefined ? undefined : map.get(key);
                return sum + Math.max(0, sign * (section?.[endpoint].y ?? 0));
            }, 0);
        const left = total(before, 'to');
        const right = total(after, 'from');
        const coordinate = (amount: number) => project(sign * (percent && amount ? 100 : amount));
        if (before) points.push({x: grid[i], y: coordinate(left)});
        if (after && (!before || left !== right)) points.push({x: grid[i], y: coordinate(right)});
    }
    return collectSections(points, interpolation, true);
}

interface StackInterval {
    curves: (CurveSection | undefined)[];
    positive?: CurveSection;
    negative?: CurveSection;
    baseline: number;
    projection: NonNullable<AreaGeometryOptions['projection']>;
    changingSign: boolean;
    percent: boolean;
}

/** Reconstruct each side cumulatively so adjacent layers share identical coordinates. */
function stackColumns(
    interval: StackInterval,
    t: number,
    x: number,
    zeros: ReadonlySet<number> | undefined,
    directions: number[],
) {
    const {curves, positive, negative, baseline, projection, changingSign, percent} = interval;
    const values = curves.map((curve, index) => {
        if (!curve || zeros?.has(index) || (curve.from.y === 0 && curve.to.y === 0)) return 0;
        const value = evaluateAtX(curve, t);
        const direction = directions[index];
        return direction * Math.max(0, direction * value);
    });
    const result: Column[] = curves.map(() => ({x, y0: baseline, y1: baseline}));
    for (const sign of [1, -1]) {
        const weights = values.map((value) => Math.max(0, value * sign));
        let total = weights.reduce((sum, value) => sum + value, 0);
        const linear = curves.map((curve) =>
            curve ? Math.max(0, sign * (curve.from.y + t * (curve.to.y - curve.from.y))) : 0,
        );
        const linearTotal = linear.reduce((sum, value) => sum + value, 0);
        const envelope = sign === 1 ? positive : negative;
        // Signed crossings must reach zero at the selected curve's root. Summing
        // its signed parts preserves that root without a discontinuous rescaling.
        let extent = 0;
        if (changingSign) extent = total;
        else if (linearTotal && envelope)
            extent = Math.max(0, sign * projection.invert(evaluateAtX(envelope, t)));
        if (percent) extent = Math.min(100, extent);
        // Cardinal can overshoot every eligible thickness below zero. Restore the
        // envelope using endpoint weights; a zero interval has no weight to restore.
        const deficit = Math.max(0, extent - total);
        if (deficit && linearTotal) {
            weights.forEach((weight, index) => {
                weights[index] = weight + (deficit * linear[index]) / linearTotal;
            });
            total += deficit;
        }
        let offset = 0;
        let remaining = extent;
        let last = weights.length - 1;
        while (last >= 0 && weights[last] === 0) last--;
        for (let index = 0; index < curves.length; index++) {
            const curve = curves[index];
            if (!curve) continue;
            const direction = directions[index];
            if (direction !== sign) continue;
            // Use the exact outer endpoint for the last nonempty layer, and keep
            // every intermediate boundary inside the remaining nonnegative extent.
            const thickness =
                index === last
                    ? remaining
                    : Math.min(remaining, total ? (weights[index] / total) * extent : 0);
            const y0 = offset;
            offset = index === last ? sign * extent : offset + sign * thickness;
            remaining = Math.max(0, remaining - thickness);
            result[index] = {x, y0: projection.project(y0), y1: projection.project(offset)};
        }
    }
    return result;
}

function getCurveValue(
    point: GeometryInput['points'][number],
    stacked: boolean,
    positiveDirection: number,
) {
    if (point.y === null) return null;
    if (!stacked) return point.y;
    return point.stackValue ?? positiveDirection * (point.y - point.y0);
}

function getBoundaryParameters(curve: CurveSection, range: readonly [number, number]) {
    return range.flatMap((x) =>
        getZeroParameters({
            from: {x: curve.from.x, y: curve.from.x - x},
            first: {x: curve.first.x, y: curve.first.x - x},
            second: {x: curve.second.x, y: curve.second.x - x},
            to: {x: curve.to.x, y: curve.to.x - x},
        }),
    );
}

export function buildAreaGeometry(
    data: GeometryInput[],
    baseline: number,
    positiveDirection = -1,
    reversedX = false,
    options: AreaGeometryOptions = {},
): AreaGeometry[] {
    const interpolation = data[0]?.series.interpolation ?? {type: 'linear'};
    const stacked = data.some((item) => item.series.stacking);
    const percent = data.some((item) => item.series.stacking === 'percent');
    const projection = options.projection ?? {
        project: (value: number) => baseline + positiveDirection * value,
        invert: (coordinate: number) => (coordinate - baseline) / positiveDirection,
    };
    const points = data.map((item) => {
        const list = item.points;
        return list.length && list[0].x > list[list.length - 1].x ? list.slice().reverse() : list;
    });
    const grid = Array.from(new Set(points.flatMap((list) => list.map((point) => point.x)))).sort(
        (a, b) => a - b,
    );
    const upper = points.map((list) =>
        collectSections(
            list.map((point) => ({
                x: point.x,
                y: getCurveValue(point, stacked, positiveDirection),
            })),
            interpolation,
            stacked,
        ),
    );
    const lower = stacked
        ? []
        : points.map((list) =>
              collectSections(
                  list.map((point) => ({x: point.x, y: point.y === null ? null : point.y0})),
                  interpolation,
              ),
          );
    const positive = stacked
        ? getEnvelope(grid, upper, 1, interpolation, projection.project, percent)
        : undefined;
    const negative = stacked
        ? getEnvelope(grid, upper, -1, interpolation, projection.project, percent)
        : undefined;
    const output: BandColumn[][] = data.map(() => []);
    for (let i = 1; i < grid.length; i++) {
        const from = grid[i - 1];
        const to = grid[i];
        const key = intervalKey(from, to);
        const curves = upper.map((map) => map.get(key));
        const roots = new Map<number, Set<number>>();
        if (stacked && interpolation.type !== 'step') {
            curves.forEach((curve, index) => {
                if (!curve || curve.from.y * curve.to.y >= 0) return;
                for (const root of getZeroFractions(curve)) {
                    const indices = roots.get(root) ?? new Set<number>();
                    indices.add(index);
                    roots.set(root, indices);
                }
            });
        }
        const interval: StackInterval = {
            curves,
            baseline,
            projection,
            percent,
            positive: positive?.get(key),
            negative: negative?.get(key),
            changingSign: curves.some((curve) => curve && curve.from.y * curve.to.y < 0),
        };
        const evaluate = (t: number, directions: number[]): Column[] => {
            const x = from + t * (to - from);
            if (stacked) return stackColumns(interval, t, x, roots.get(t), directions);
            return curves.map((curve, index) => {
                const bottom = lower[index].get(key);
                if (!curve || !bottom) return {x, y0: baseline, y1: baseline};
                const upperPoint = evaluateSection(curve, t);
                return {
                    x: upperPoint.x,
                    y0: evaluateSection(bottom, t).y,
                    y1: upperPoint.y,
                };
            });
        };
        let samples: Column[][];
        if (interpolation.type === 'step') {
            let position = interpolation.position ?? 'after';
            if (reversedX && position !== 'middle') {
                position = position === 'after' ? 'before' : 'after';
            }
            let transition = (from + to) / 2;
            if (position === 'before') transition = from;
            else if (position === 'after') transition = to;
            const directionsAt = (endpoint: 'from' | 'to') =>
                curves.map((curve) => Math.sign(curve?.[endpoint].y ?? 0) || 1);
            const first = evaluate(0, directionsAt('from'));
            const last = evaluate(1, directionsAt('to'));
            samples = [
                first,
                first.map((column) => ({...column, x: transition})),
                last.map((column) => ({...column, x: transition})),
                last,
            ];
        } else {
            const cutSet = new Set([0, ...roots.keys(), 1]);
            if (options.xRange) {
                if (stacked) {
                    for (const x of options.xRange) {
                        const fraction = (x - from) / (to - from);
                        if (fraction > 0 && fraction < 1) cutSet.add(fraction);
                    }
                } else {
                    for (const curve of curves) {
                        if (!curve) continue;
                        for (const t of getBoundaryParameters(curve, options.xRange)) cutSet.add(t);
                    }
                }
            }
            const cuts = [...cutSet].sort((a, b) => a - b);
            samples = [];
            for (let j = 1; j < cuts.length; j++) {
                const start = cuts[j - 1];
                const end = cuts[j];
                const middle = (start + end) / 2;
                const directions = curves.map((curve) => {
                    if (!curve || (curve.from.y === 0 && curve.to.y === 0)) return 1;
                    if (curve.from.y >= 0 && curve.to.y >= 0) return 1;
                    if (curve.from.y <= 0 && curve.to.y <= 0) return -1;
                    return Math.sign(evaluateAtX(curve, middle)) || 1;
                });
                const x = stacked
                    ? from + middle * (to - from)
                    : evaluate(middle, directions)[0]?.x;
                if (options.xRange && (x < options.xRange[0] || x > options.xRange[1])) continue;
                samples.push(...sampleInterval((t) => evaluate(t, directions), start, end));
            }
        }
        output.forEach((columns, index) => {
            if (!curves[index] || samples.length === 0) {
                if (columns[columns.length - 1]) columns.push(null);
                return;
            }
            for (const sample of samples) append(columns, sample[index]);
        });
    }
    // Keep isolated observations, including signed zero endpoints, available to
    // the outline without making them contribute to any neighboring filled interval.
    output.forEach((columns, index) => {
        const key = (column: Column) => `${column.x}:${column.y1.toFixed(6)}`;
        const present = new Set(
            columns.filter((column): column is Column => column !== null).map(key),
        );
        for (const point of points[index]) {
            if (
                point.y === null ||
                point.hiddenInLine ||
                (options.xRange && (point.x < options.xRange[0] || point.x > options.xRange[1]))
            )
                continue;
            const column = {x: point.x, y0: point.y, y1: point.y};
            if (!present.has(key(column))) columns.push(null, column, null);
        }
    });
    return output.map((columns) => getPaths(filterVisibleColumns(columns, options.yRange)));
}

function filterVisibleColumns(columns: BandColumn[], range?: readonly [number, number]) {
    if (!range) return columns;
    const result: BandColumn[] = [];
    let run: NonNullable<BandColumn>[] = [];
    const flush = () => {
        let min = Infinity,
            max = -Infinity;
        for (const column of run) {
            min = Math.min(min, column.y1);
            max = Math.max(max, column.y1);
        }
        if (min <= range[1] && max >= range[0]) {
            if (result.length) result.push(null);
            for (const column of run) result.push(column);
        }
        run = [];
    };
    for (const column of columns) {
        if (column) run.push(column);
        else flush();
    }
    flush();
    return result;
}

/**
 * Original anchors of a drawn run remain available even when a curve enters Y
 * bounds between two offscreen observations. Empty runs keep their original flags.
 */
function revealDrawnAnchors(item: PreparedAreaData) {
    const ranges: [number, number][] = [];
    let current: [number, number] | undefined;
    for (const column of item.geometry?.columns ?? []) {
        if (!column) {
            current = undefined;
            continue;
        }
        if (current) {
            current[0] = Math.min(current[0], column.x);
            current[1] = Math.max(current[1], column.x);
        } else {
            current = [column.x, column.x];
            ranges.push(current);
        }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const range of ranges) {
        const last = merged[merged.length - 1];
        if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
        else merged.push(range);
    }
    const sorted = item.points.slice().sort((a, b) => a.x - b.x);
    let cursor = 0;
    for (const [min, max] of merged) {
        let before: PointData | undefined;
        while (cursor < sorted.length && sorted[cursor].x < min) before = sorted[cursor++];
        if (before && before.y !== null) before.hiddenInLine = false;
        while (cursor < sorted.length && sorted[cursor].x <= max) {
            const point = sorted[cursor++];
            if (point.y !== null) point.hiddenInLine = false;
        }
        const after = sorted[cursor];
        if (after && after.y !== null) after.hiddenInLine = false;
    }
}

export function prepareAreaGeometry(
    data: PreparedAreaData[],
    getOptions: (series: PreparedAreaSeries) => PreparedGeometryOptions,
) {
    for (const items of group(data, (item) =>
        JSON.stringify([item.series.yAxis, item.series.stackId]),
    ).values()) {
        const interpolation = items[0].series.interpolation;
        if (!interpolation || interpolation.type === 'linear') continue;
        const options = getOptions(items[0].series);
        const inputs = items.map((item) => {
            const breaks = getAreaGeometryBreaks(item.series.data);
            if (!breaks?.size) return item;
            const points: GeometryInput['points'][number][] = [];
            for (const point of item.points) {
                if (breaks.has(point.data)) points.push({...point, y: null});
                points.push(point);
            }
            return {...item, points};
        });
        const geometries = buildAreaGeometry(
            inputs,
            options.baseline,
            options.positiveDirection,
            options.reversedX,
            options,
        );
        items.forEach((item, index) => {
            item.geometry = geometries[index];
            revealDrawnAnchors(item);
            const columns = item.geometry.columns.filter(
                (column): column is Column => column !== null,
            );
            const upper = columns.map((column) => ({x: column.x, y: column.y1}));
            if (item.series.gradient) item.gradientBBox = getGradientBBox(upper);
            if (item.series.fillGradient)
                item.fillGradientBBox = getGradientBBox([
                    ...upper,
                    ...columns.map((column) => ({x: column.x, y: column.y0})),
                ]);
        });
    }
}
