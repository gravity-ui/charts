import {group} from 'd3-array';
import {area, line} from 'd3-shape';

import type {PreparedAreaSeries} from '~core/series/types';
import {getGradientBBox} from '~core/utils/gradient';

import type {AreaSeries, SeriesInterpolation} from '../../types';
import {
    evaluateAtX,
    evaluateSection,
    getCriticalParameters,
    getSectionYValues,
    getZeroFractions,
    getZeroParameters,
} from '../interpolation/curves';
import type {CurvePoint, CurveSection} from '../interpolation/curves';

import type {BandColumn} from './band';
import {collectSections, intervalKey} from './curves';
import type {AreaGeometry, PointData, PreparedAreaData} from './types';
import {withAreaGeometryBreaks} from './zoom';

type Column = NonNullable<BandColumn>;

interface GeometryInput {
    points: readonly Pick<PointData, 'x' | 'y' | 'y0' | 'stackValue' | 'hiddenInLine'>[];
    series: Pick<AreaSeries, 'stacking' | 'interpolation'>;
}

interface ValueProjection {
    project: (value: number) => number;
    invert: (coordinate: number) => number;
}

export interface AreaGeometryOptions {
    baseline: number;
    projection: ValueProjection;
    reversedX?: boolean;
    xRange?: readonly [number, number];
    yRange?: readonly [number, number];
}

// Render and hit-test the same mesh, subdividing toward a tenth of a CSS pixel.
// Quarter probes also catch inflection points that a midpoint alone would miss.
const MESH_TOLERANCE = 0.1;
const MAX_SUBDIVISIONS = 12;

function sampleInterval(evaluate: (t: number) => Column[], start = 0, end = 1) {
    const cache = new Map<number, Column[]>();
    const sample = (t: number) => {
        let value = cache.get(t);
        if (!value) {
            value = evaluate(t);
            cache.set(t, value);
        }
        return value;
    };
    const first = sample(start);
    const last = sample(end);
    const samples = [first];
    const keys: (keyof Column)[] = ['x', 'y0', 'y1'];
    const subdivide = (a: number, b: number, left: Column[], right: Column[], depth: number) => {
        const middle = (a + b) / 2;
        const center = sample(middle);
        const needsSubdivision = [0.25, 0.5, 0.75].some((fraction) => {
            const actual = fraction === 0.5 ? center : sample(a + (b - a) * fraction);
            return actual.some((column, index) =>
                keys.some(
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

/** Find extrema of constrained boundaries without approximating their entire paths. */
function sampleExtrema(evaluate: (t: number) => Column[], start = 0, end = 1) {
    const cache = new Map<number, Column[]>();
    const sample = (t: number) => {
        let columns = cache.get(t);
        if (!columns) {
            columns = evaluate(t);
            cache.set(t, columns);
        }
        return columns;
    };
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        sample(start + fraction * (end - start));
    }
    // Redistribution can shift an extremum just past a scalar critical point.
    // Probe both endpoint neighborhoods before choosing refinement brackets.
    for (const fraction of [1e-6, 1e-3, 1 - 1e-3, 1 - 1e-6]) {
        sample(start + fraction * (end - start));
    }
    const probes = [...cache.keys()].sort((a, b) => a - b);
    const values = probes.map(sample);
    for (let i = 1; i < probes.length - 1; i++) {
        for (let index = 0; index < values[i].length; index++) {
            for (const key of ['y0', 'y1'] as const) {
                const before = values[i - 1][index][key];
                const center = values[i][index][key];
                const after = values[i + 1][index][key];
                let direction = 0;
                if (center > before && center > after) {
                    direction = 1;
                } else if (center < before && center < after) {
                    direction = -1;
                }
                if (!direction) {
                    continue;
                }
                let left = probes[i - 1];
                let right = probes[i + 1];
                const ratio = (Math.sqrt(5) - 1) / 2;
                let a = right - ratio * (right - left);
                let b = left + ratio * (right - left);
                // Golden-section refinement reduces the bracket below 3e-7
                // of its initial width; extrema have quadratic value error.
                for (let iteration = 0; iteration < 32; iteration++) {
                    if (direction * sample(a)[index][key] < direction * sample(b)[index][key]) {
                        left = a;
                        a = b;
                        b = left + ratio * (right - left);
                    } else {
                        right = b;
                        b = a;
                        a = right - ratio * (right - left);
                    }
                }
                sample((left + right) / 2);
            }
        }
    }
    return [...cache].sort(([a], [b]) => a - b).map(([, columns]) => columns);
}

function append(columns: BandColumn[], column: Column) {
    const previous = columns[columns.length - 1];
    if (previous && previous.x === column.x) {
        if (previous.y0 === column.y0 && previous.y1 === column.y1) {
            return;
        }
        // Keep opposite stack offsets disconnected at a signed root.
        if (previous.y0 === previous.y1 && column.y0 === column.y1) {
            columns.push(null);
        }
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
        if (before) {
            points.push({x: grid[i], y: coordinate(left)});
        }
        if (after && (!before || left !== right)) {
            points.push({x: grid[i], y: coordinate(right)});
        }
    }
    return collectSections(points, interpolation, true);
}

interface StackInterval {
    curves: (CurveSection | undefined)[];
    positive?: CurveSection;
    negative?: CurveSection;
    baseline: number;
    projection: ValueProjection;
    changingSign: boolean;
    percent: boolean;
}

function stackColumns(
    interval: StackInterval,
    t: number,
    x: number,
    zeros: ReadonlySet<number> | undefined,
    directions: number[],
) {
    const {curves, positive, negative, baseline, projection, changingSign, percent} = interval;
    const values = curves.map((curve, index) => {
        if (!curve || zeros?.has(index) || (curve.from.y === 0 && curve.to.y === 0)) {
            return 0;
        }
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
        // Signed roots must reach zero without envelope rescaling.
        let extent = 0;
        if (changingSign) {
            extent = total;
        } else if (linearTotal && envelope) {
            extent = Math.max(0, sign * projection.invert(evaluateAtX(envelope, t)));
        }
        if (percent) {
            extent = Math.min(100, extent);
        }
        // Restore endpoint weights if all cardinal weights overshoot below zero.
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
        while (last >= 0 && weights[last] === 0) {
            last--;
        }
        for (let index = 0; index < curves.length; index++) {
            const curve = curves[index];
            if (!curve) {
                continue;
            }
            const direction = directions[index];
            if (direction !== sign) {
                continue;
            }
            // Assign the remainder to the last layer to avoid rounding gaps.
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

function prepareCurves(data: GeometryInput[], projection: ValueProjection) {
    const interpolation = data[0]?.series.interpolation ?? {type: 'linear'};
    const stacked = data.some((item) => item.series.stacking);
    const percent = data.some((item) => item.series.stacking === 'percent');
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
                y: stacked && point.y !== null ? (point.stackValue ?? null) : point.y,
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
    return {
        interpolation,
        stacked,
        percent,
        points,
        grid,
        upper,
        lower,
        positive,
        negative,
    };
}

/** Fit envelopes analytically and optimize constrained signed/logarithmic boundaries. */
export function getAreaGeometryDomain(
    data: GeometryInput[],
    options: Pick<AreaGeometryOptions, 'projection' | 'xRange'> & {logarithmic?: boolean},
) {
    const {projection, xRange, logarithmic} = options;
    const {grid, upper, positive, negative} = prepareCurves(data, projection);
    const signed = upper.some((sections) =>
        [...sections.values()].some((curve) => curve.from.y * curve.to.y < 0),
    );
    if (logarithmic || signed) {
        const baseline = projection.project(0);
        let min = Infinity;
        let max = -Infinity;
        for (const columns of buildColumns(data, {baseline, projection, xRange}, sampleExtrema)) {
            for (const column of columns) {
                if (!column) {
                    continue;
                }
                for (const y of [column.y0, column.y1]) {
                    if (logarithmic && y === baseline) {
                        continue;
                    }
                    const value = projection.invert(y);
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                }
            }
        }
        return min <= max ? [min, max] : [];
    }
    const values: number[] = [];
    for (let i = 1; i < grid.length; i++) {
        const key = intervalKey(grid[i - 1], grid[i]);
        for (const [sign, envelope] of [
            [1, positive],
            [-1, negative],
        ] as const) {
            const section = envelope?.get(key);
            if (
                !section ||
                !upper.some((map) => {
                    const curve = map.get(key);
                    return curve && (sign * curve.from.y > 0 || sign * curve.to.y > 0);
                })
            ) {
                continue;
            }
            const contribution = getSectionYValues(section, xRange);
            if (contribution.length) {
                values.push(0, ...contribution.map((value) => sign * Math.max(0, sign * value)));
            }
        }
    }
    // Include isolated observations, which have no envelope interval.
    for (const item of data) {
        for (const point of item.points) {
            if (point.y !== null && (!xRange || (point.x >= xRange[0] && point.x <= xRange[1]))) {
                values.push(point.y);
            }
        }
    }
    return values;
}

export function buildAreaGeometry(
    data: GeometryInput[],
    options: AreaGeometryOptions,
): AreaGeometry[] {
    return buildColumns(data, options).map((columns) =>
        getPaths(filterVisibleColumns(columns, options.yRange)),
    );
}

function buildColumns(
    data: GeometryInput[],
    {baseline, projection, reversedX, xRange}: AreaGeometryOptions,
    sample = sampleInterval,
): BandColumn[][] {
    const {interpolation, stacked, percent, points, grid, upper, lower, positive, negative} =
        prepareCurves(data, projection);
    const output: BandColumn[][] = data.map(() => []);
    for (let i = 1; i < grid.length; i++) {
        const from = grid[i - 1];
        const to = grid[i];
        const key = intervalKey(from, to);
        const curves = upper.map((map) => map.get(key));
        const roots = new Map<number, Set<number>>();
        if (stacked && interpolation.type !== 'step') {
            curves.forEach((curve, index) => {
                if (!curve || curve.from.y * curve.to.y >= 0) {
                    return;
                }
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
            if (stacked) {
                return stackColumns(interval, t, x, roots.get(t), directions);
            }
            return curves.map((curve, index) => {
                const bottom = lower[index].get(key);
                if (!curve || !bottom) {
                    return {x, y0: baseline, y1: baseline};
                }
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
            if (position === 'before') {
                transition = from;
            } else if (position === 'after') {
                transition = to;
            }
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
            if (sample === sampleExtrema) {
                // Roots and scalar critical points isolate the turns that can
                // contribute an extremum after clamping and redistribution.
                for (const curve of [...curves, interval.positive, interval.negative]) {
                    if (!curve) {
                        continue;
                    }
                    for (const parameter of [
                        ...getCriticalParameters(curve),
                        ...getZeroParameters(curve),
                    ]) {
                        cutSet.add((evaluateSection(curve, parameter).x - from) / (to - from));
                    }
                }
            }
            if (xRange) {
                if (stacked) {
                    for (const x of xRange) {
                        const fraction = (x - from) / (to - from);
                        if (fraction > 0 && fraction < 1) {
                            cutSet.add(fraction);
                        }
                    }
                } else {
                    for (const curve of curves) {
                        if (!curve) {
                            continue;
                        }
                        for (const t of getBoundaryParameters(curve, xRange)) {
                            cutSet.add(t);
                        }
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
                    if (!curve || (curve.from.y === 0 && curve.to.y === 0)) {
                        return 1;
                    }
                    if (curve.from.y >= 0 && curve.to.y >= 0) {
                        return 1;
                    }
                    if (curve.from.y <= 0 && curve.to.y <= 0) {
                        return -1;
                    }
                    return Math.sign(evaluateAtX(curve, middle)) || 1;
                });
                const x = stacked
                    ? from + middle * (to - from)
                    : evaluate(middle, directions)[0]?.x;
                if (xRange && (x < xRange[0] || x > xRange[1])) {
                    continue;
                }
                samples.push(...sample((t) => evaluate(t, directions), start, end));
            }
            if (stacked && xRange && xRange[0] === xRange[1]) {
                const t = (xRange[0] - from) / (to - from);
                if (t >= 0 && t <= 1) {
                    const directions = curves.map((curve) =>
                        curve ? Math.sign(evaluateAtX(curve, t)) || 1 : 1,
                    );
                    samples = [evaluate(t, directions)];
                }
            }
        }
        output.forEach((columns, index) => {
            if (!curves[index] || samples.length === 0) {
                if (columns[columns.length - 1]) {
                    columns.push(null);
                }
                return;
            }
            for (const columnsAtX of samples) {
                append(columns, columnsAtX[index]);
            }
        });
    }
    // Isolated observations contribute an outline point, never a filled interval.
    output.forEach((columns, index) => {
        const key = (column: Column) => `${column.x}:${column.y1.toFixed(6)}`;
        const present = new Set(
            columns.filter((column): column is Column => column !== null).map(key),
        );
        for (const point of points[index]) {
            if (
                point.y === null ||
                point.hiddenInLine ||
                (xRange && (point.x < xRange[0] || point.x > xRange[1]))
            ) {
                continue;
            }
            const column = {x: point.x, y0: point.y, y1: point.y};
            if (!present.has(key(column))) {
                columns.push(null, column, null);
            }
        }
    });
    return output;
}

function filterVisibleColumns(columns: BandColumn[], range?: readonly [number, number]) {
    if (!range) {
        return columns;
    }
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
            if (result.length) {
                result.push(null);
            }
            for (const column of run) {
                result.push(column);
            }
        }
        run = [];
    };
    for (const column of columns) {
        if (column) {
            run.push(column);
        } else {
            flush();
        }
    }
    flush();
    return result;
}

/** Keep tooltip anchors when only the curve between offscreen samples enters the viewport. */
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
        if (last && range[0] <= last[1]) {
            last[1] = Math.max(last[1], range[1]);
        } else {
            merged.push(range);
        }
    }
    const sorted = item.points.slice().sort((a, b) => a.x - b.x);
    let cursor = 0;
    for (const [min, max] of merged) {
        let before: PointData | undefined;
        while (cursor < sorted.length && sorted[cursor].x < min) {
            before = sorted[cursor++];
        }
        if (before && before.y !== null) {
            before.hiddenInLine = false;
        }
        while (cursor < sorted.length && sorted[cursor].x <= max) {
            const point = sorted[cursor++];
            if (point.y !== null) {
                point.hiddenInLine = false;
            }
        }
        const after = sorted[cursor];
        if (after && after.y !== null) {
            after.hiddenInLine = false;
        }
    }
}

export function prepareAreaGeometry(
    data: PreparedAreaData[],
    getOptions: (series: PreparedAreaSeries) => AreaGeometryOptions,
) {
    for (const items of group(data, (item) =>
        JSON.stringify([item.series.yAxis, item.series.stackId]),
    ).values()) {
        const interpolation = items[0].series.interpolation;
        if (!interpolation || interpolation.type === 'linear') {
            continue;
        }
        const options = getOptions(items[0].series);
        const inputs = items.map((item) => ({
            series: item.series,
            points: withAreaGeometryBreaks(item.points, item.series.data),
        }));
        const geometries = buildAreaGeometry(inputs, options);
        items.forEach((item, index) => {
            item.geometry = geometries[index];
            revealDrawnAnchors(item);
            const columns = item.geometry.columns.filter(
                (column): column is Column => column !== null,
            );
            const upper = columns.map((column) => ({x: column.x, y: column.y1}));
            if (item.series.gradient) {
                item.gradientBBox = getGradientBBox(upper);
            }
            if (item.series.fillGradient) {
                item.fillGradientBBox = getGradientBBox([
                    ...upper,
                    ...columns.map((column) => ({x: column.x, y: column.y0})),
                ]);
            }
        });
    }
}
