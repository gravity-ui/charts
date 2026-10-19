import {group} from 'd3-array';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {ChartScale} from '../scales/types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {PreparedSeries, PreparedSeriesOptions} from '../series/types';
import type {ChartMargin, ChartPlotPadding} from '../types';
import {calculateNumericProperty, parseNonNegativeSize} from '../utils/math';

import type {PreparedSplit} from './split-types';

/** Geometry in unpadded, plot-local coordinates, measured once by its plugin. */
export interface PlotPaddingPoint extends ChartMargin {
    x: number;
    y: number;
}

export interface PlotPaddingContribution {
    points: PlotPaddingPoint[];
    options?: ChartPlotPadding;
}

export interface PreparePlotPaddingArgs {
    split: PreparedSplit;
    series: PreparedSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    yAxis: PreparedYAxis[];
    xScale: ChartScale;
    yScale: (ChartScale | undefined)[];
}

const sides = ['top', 'right', 'bottom', 'left'] as const;

export function validatePlotPadding(value: ChartPlotPadding | undefined, name: string) {
    if (value === undefined) return;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: `${name} must be an object`,
        });
    }
    for (const side of sides) {
        const size = value[side];
        if (size !== undefined && size !== 'auto' && !parseNonNegativeSize(size)) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: `${name}.${side} must be auto or a finite, nonnegative pixel or percentage size`,
            });
        }
    }
}

interface InsetConstraint {
    /** Position as a fraction of the original scale range. */
    position: number;
    before: number;
    after: number;
}

/** Keep opposing reservations finite and proportionally fit them into the available range. */
function fitInsets(before: number, after: number, size: number): [number, number] {
    const max = Math.max(before, after, size, 1);
    const total = before / max + after / max;
    if (total > size / max) {
        return [size * (before / max / total), size * (after / max / total)];
    }
    return [before, after];
}

function resolveInsets(args: {
    size: number;
    range: number[];
    before: 'left' | 'top';
    after: 'right' | 'bottom';
    options: ChartPlotPadding;
    contributions: PlotPaddingContribution[];
}): [number, number] {
    const {size, range, before, after, options, contributions} = args;
    const min = Math.min(...range);
    const max = Math.max(...range);
    const span = Math.max(0, max - min);
    const explicit = (value: number | string | undefined) =>
        Math.min(size, calculateNumericProperty({value, base: size}) ?? 0);
    const autoBefore = options[before] === 'auto';
    const autoAfter = options[after] === 'auto';
    let start = autoBefore ? 0 : explicit(options[before]);
    let end = autoAfter ? 0 : explicit(options[after]);
    const constraints: InsetConstraint[] = [];
    let fallbackStart = start;
    let fallbackEnd = end;
    for (const {points, options: typeOptions} of contributions) {
        const typeBefore = typeOptions?.[before] ?? 'auto';
        const typeAfter = typeOptions?.[after] ?? 'auto';
        if (autoBefore && typeBefore !== 'auto') start = Math.max(start, explicit(typeBefore));
        if (autoAfter && typeAfter !== 'auto') end = Math.max(end, explicit(typeAfter));
        for (const point of points) {
            const coordinate = before === 'left' ? point.x : point.y;
            const position = span ? Math.max(0, Math.min(1, (coordinate - min) / span)) : 0.5;
            if (!Number.isFinite(position)) continue;
            const a = autoBefore && typeBefore === 'auto' ? point[before] : 0;
            const b = autoAfter && typeAfter === 'auto' ? point[after] : 0;
            fallbackStart = Math.max(fallbackStart, a);
            fallbackEnd = Math.max(fallbackEnd, b);
            constraints.push({position, before: a - coordinate, after: b - (size - coordinate)});
        }
    }
    // Each point moves by start * (1 - t) - end * t. Solve the two coupled
    // inequalities monotonically, accounting for existing domain/band/zoom room.
    // Geometry is cached above; there is no repeated series preparation or relayout.
    for (let iteration = 0; iteration < 32; iteration++) {
        let nextStart = start;
        let nextEnd = end;
        for (const c of constraints) {
            if (autoBefore && c.position < 1) {
                nextStart = Math.max(nextStart, (c.before + end * c.position) / (1 - c.position));
            }
            if (autoAfter && c.position > 0) {
                nextEnd = Math.max(nextEnd, (c.after + start * (1 - c.position)) / c.position);
            }
        }
        if (nextStart + nextEnd >= span) return fitInsets(nextStart, nextEnd, span);
        if (nextStart - start + nextEnd - end < 1e-7) return [nextStart, nextEnd];
        start = nextStart;
        end = nextEnd;
    }
    // Near-degenerate layouts can converge slowly. Full symbol extents are a
    // conservative bounded fallback; oversized symbols are allowed to clip.
    return fitInsets(Math.max(start, fallbackStart), Math.max(end, fallbackEnd), span);
}

function insetRange(scale: ChartScale, before: number, after: number) {
    if (before === 0 && after === 0) return;
    const range = scale.range();
    const min = Math.min(...range);
    const max = Math.max(...range);
    const span = max - min;
    scale.range(
        range.map((value) =>
            span ? min + before + ((value - min) / span) * Math.max(0, span - before - after) : min,
        ),
    );
}

export function applyPlotPadding(
    args: PreparePlotPaddingArgs & {
        options?: ChartPlotPadding;
        width: number;
        height: number;
    },
): ChartMargin[] | undefined {
    const {options, xScale, yScale, yAxis, series} = args;
    const isActive = (value: number | string | undefined) =>
        value === 'auto' || (parseNonNegativeSize(value)?.value ?? 0) > 0;
    if (!options || !sides.some((side) => isActive(options[side]))) return undefined;
    const hasVerticalPadding = isActive(options.top) || isActive(options.bottom);
    const hasAutoPadding = sides.some((side) => options[side] === 'auto');
    const width = Math.max(0, args.width);
    const height = Math.max(0, args.height);
    if (width === 0) xScale.range([0, 0]);
    for (let index = 0; index < yScale.length; index++) {
        const scale = yScale[index];
        const plotHeight = Math.max(0, args.split.plots[yAxis[index]?.plotIndex]?.height ?? height);
        // Existing scales share the first plot's height; titles can leave different
        // drawable heights in other plots. Resolve insets in each plot's own range.
        if (scale && hasVerticalPadding && plotHeight !== height)
            scale.range(scale.range().map((value) => (height ? (value / height) * plotHeight : 0)));
        if (plotHeight === 0) scale?.range([0, 0]);
    }
    const contributions = new Map<number, PlotPaddingContribution[]>();
    for (const [plotIndex, axes] of group(yAxis, (axis) => axis.plotIndex)) {
        const plotSeries = series.filter(
            (s) => s.visible && 'yAxis' in s && axes.includes(yAxis[s.yAxis]),
        );
        const items: PlotPaddingContribution[] = [];
        for (const [type, typeSeries] of group(plotSeries, (s) => s.type)) {
            const contribution = hasAutoPadding
                ? getSeriesPlugin(type).getPlotPadding?.({...args, series: typeSeries})
                : undefined;
            if (contribution) items.push(contribution);
        }
        contributions.set(plotIndex, items);
    }
    // X is shared by split plots, so its reservation must fit all of them.
    const [left, right] = resolveInsets({
        size: width,
        range: xScale.range(),
        before: 'left',
        after: 'right',
        options,
        contributions: [...contributions.values()].flat(),
    });
    const padding: ChartMargin[] = [];
    for (const [plotIndex, items] of contributions) {
        const indices = yAxis.flatMap((axis, index) =>
            axis.plotIndex === plotIndex ? [index] : [],
        );
        const scale = indices.map((index) => yScale[index]).find(Boolean);
        const [top, bottom] = resolveInsets({
            size: Math.max(0, args.split.plots[plotIndex]?.height ?? height),
            range: scale?.range() ?? [0, height],
            before: 'top',
            after: 'bottom',
            options,
            contributions: items,
        });
        padding[plotIndex] = {left, right, top, bottom};
        for (const index of indices) {
            if (yScale[index]) insetRange(yScale[index], top, bottom);
        }
    }
    insetRange(xScale, left, right);
    return padding;
}
