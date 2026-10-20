import {group} from 'd3-array';
import {scaleLinear} from 'd3-scale';

import {getAutomaticTickValues} from '../../components/AxisY/utils';
import type {PreparedAxis, PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSplit} from '../layout/split-types';
import {getSeriesPlugin} from '../series/seriesRegistry';
import type {PreparedSeries, PreparedSeriesOptions} from '../series/types';
import type {ChartMargin} from '../types';
import {getTicksCountByPixelInterval, shouldSyncAxisWithPrimary} from '../utils/axis/common';
import {calculateNumericProperty} from '../utils/math';

import type {ChartScale, ChartScaleLinear} from './types';
import {clusterYAxes} from './utils';
import {
    getDomainMaxAlignedToEndTick,
    getDomainMinAlignedToStartTick,
    getDomainSyncedToPrimaryTicks,
} from './y-scale';

/** Paint extents and centers projected once, before domain expansion, in plot-local pixels. */
export interface AxisPaddingPoint extends ChartMargin {
    x: number;
    y: number;
    yAxis: number;
}

export interface PrepareAxisPaddingArgs {
    split: PreparedSplit;
    series: PreparedSeries[];
    seriesOptions?: PreparedSeriesOptions;
    xAxis: PreparedXAxis;
    yAxis: PreparedYAxis[];
    xScale: ChartScale;
    yScale: (ChartScale | undefined)[];
}

interface PaddingConstraint {
    value: number;
    before: number;
    after: number;
}

function hasPadding(axis: PreparedAxis) {
    return (
        axis.type !== 'category' &&
        ((axis.min === undefined && axis.padding?.min !== undefined) ||
            (axis.max === undefined && axis.padding?.max !== undefined))
    );
}

function fitAxis(args: {
    axis: PreparedAxis;
    direction: 'x' | 'y';
    scale: ChartScale;
    series: PreparedSeries[];
    points: AxisPaddingPoint[];
    primaryTicksCount?: number;
    syncTicks?: boolean;
}) {
    const {axis, direction, scale, series, points} = args;
    if ((!hasPadding(axis) && !args.syncTicks) || !('invert' in scale)) return;
    if (
        series.some((s) =>
            getSeriesPlugin(s.type).isAxisDomainFixed?.({series: s, axis: direction}),
        )
    )
        return;

    const minOption = axis.min === undefined ? axis.padding?.min : undefined;
    const maxOption = axis.max === undefined ? axis.padding?.max : undefined;
    if (minOption === undefined && maxOption === undefined && !args.syncTicks) return;
    const range = scale.range();
    const lo = Math.min(...range);
    const hi = Math.max(...range);
    const span = hi - lo;
    const domain = scale.domain().map(Number);
    if (
        !Number.isFinite(span) ||
        span <= 1 ||
        !domain.every(Number.isFinite) ||
        domain[0] >= domain[1]
    )
        return;

    const reversed = range[0] > range[1];
    const beforeOption = reversed ? maxOption : minOption;
    const afterOption = reversed ? minOption : maxOption;
    const beforeEnabled =
        beforeOption === 'auto' ||
        (calculateNumericProperty({value: beforeOption, base: span}) ?? 0) > 0;
    const afterEnabled =
        afterOption === 'auto' ||
        (calculateNumericProperty({value: afterOption, base: span}) ?? 0) > 0;
    // Keep at least one pixel for data even when requested extents exceed the axis length.
    const limit = (span - 1) / Math.max(1, Number(beforeEnabled) + Number(afterEnabled));
    const originalInverse =
        axis.type === 'datetime' ? scaleLinear().domain(domain).range(range) : scale;
    const constraints: PaddingConstraint[] = [];
    if (beforeOption === 'auto' || afterOption === 'auto') {
        for (const point of points) {
            const coordinate = point[direction];
            const before = direction === 'x' ? point.left : point.top;
            const after = direction === 'x' ? point.right : point.bottom;
            constraints.push({
                value: Number(originalInverse.invert(coordinate)),
                before: beforeOption === 'auto' ? Math.min(limit, before) : 0,
                after: afterOption === 'auto' ? Math.min(limit, after) : 0,
            });
        }
    }
    if (beforeOption !== undefined && beforeOption !== 'auto') {
        constraints.push({
            value: Number(originalInverse.invert(lo)),
            before: Math.min(
                limit,
                calculateNumericProperty({value: beforeOption, base: span}) ?? 0,
            ),
            after: 0,
        });
    }
    if (afterOption !== undefined && afterOption !== 'auto') {
        constraints.push({
            value: Number(originalInverse.invert(hi)),
            before: 0,
            after: Math.min(limit, calculateNumericProperty({value: afterOption, base: span}) ?? 0),
        });
    }

    // Symbol measurement is cached above. Reproject only its centers when outward tick
    // rounding changes the opposite end and slightly reduces the space there.
    for (let pass = 0; pass < 8; pass++) {
        let before = 0;
        let after = 0;
        const projected = constraints.map((c) => ({...c, position: (scale(c.value) - lo) / span}));
        for (let iteration = 0; iteration < 32; iteration++) {
            let nextBefore = before;
            let nextAfter = after;
            for (const c of projected) {
                if (beforeEnabled && c.position < 1) {
                    nextBefore = Math.max(
                        nextBefore,
                        (c.before - c.position * span + after * c.position) / (1 - c.position),
                    );
                }
                if (afterEnabled && c.position > 0) {
                    nextAfter = Math.max(
                        nextAfter,
                        (c.after - (1 - c.position) * span + before * (1 - c.position)) /
                            c.position,
                    );
                }
            }
            nextBefore = Math.min(limit, nextBefore);
            nextAfter = Math.min(limit, nextAfter);
            const delta = nextBefore - before + nextAfter - after;
            before = nextBefore;
            after = nextAfter;
            if (delta < 1e-7) break;
        }
        if (before + after < 1e-6 && !(pass === 0 && args.syncTicks)) break;

        // Time scales truncate inverted values to milliseconds. Invert with full
        // precision first, then round outward so sub-millisecond gaps still fit.
        const inverseScale =
            axis.type === 'datetime'
                ? scaleLinear().domain(scale.domain().map(Number))
                : scale.copy();
        const inset = inverseScale.range(
            range.map((value) => lo + before + ((value - lo) / span) * (span - before - after)),
        );
        const nextDomain = range.map((value) => Number(inset.invert(value)));
        if (axis.type === 'datetime') {
            nextDomain[0] = Math.floor(nextDomain[0]);
            nextDomain[1] = Math.ceil(nextDomain[1]);
        }
        const minEnabled = reversed ? afterEnabled : beforeEnabled;
        const maxEnabled = reversed ? beforeEnabled : afterEnabled;
        if (!minEnabled) nextDomain[0] = Number(scale.domain()[0]);
        if (!maxEnabled) nextDomain[1] = Number(scale.domain()[1]);
        if (!nextDomain.every(Number.isFinite) || nextDomain[0] >= nextDomain[1]) break;
        const candidate = scale.copy();
        candidate.domain(nextDomain);
        if (args.primaryTicksCount !== undefined && args.primaryTicksCount >= 2) {
            const synced = getDomainSyncedToPrimaryTicks({
                scale: candidate as ChartScaleLinear,
                primaryTicksCount: args.primaryTicksCount,
                yMin: nextDomain[0],
                yMax: nextDomain[1],
            });
            if (!synced.every(Number.isFinite)) break;
            scale.domain(synced);
            continue;
        }
        const defaultRounding = direction === 'x' || axis.type === 'datetime';
        const roundMin = minEnabled && (axis.startOnTick ?? defaultRounding);
        const roundMax = maxEnabled && (axis.endOnTick ?? defaultRounding);
        if (direction === 'y' && axis.type !== 'datetime') {
            // Use the same tick thinning as the rendered Y axis. A generic nice()
            // alone may choose an end tick that gets dropped on a short chart.
            const tickArgs = {
                axis,
                range: [range[0], range[1]] as [number, number],
                scale: candidate as ChartScaleLinear,
                series,
            };
            if (roundMin) {
                nextDomain[0] = Math.min(nextDomain[0], getDomainMinAlignedToStartTick(tickArgs));
                candidate.domain(nextDomain);
            }
            if (roundMax) {
                nextDomain[1] = Math.max(nextDomain[1], getDomainMaxAlignedToEndTick(tickArgs));
            }
        } else if (roundMin || roundMax) {
            const nice = candidate
                .nice(getTicksCountByPixelInterval({axis, axisWidth: span}) ?? 10)
                .domain()
                .map(Number);
            if (roundMin) nextDomain[0] = Math.min(nextDomain[0], nice[0]);
            if (roundMax) nextDomain[1] = Math.max(nextDomain[1], nice[1]);
        }
        if (!nextDomain.every(Number.isFinite)) break;
        scale.domain(nextDomain);
    }
}

export function applyAxisPadding(
    args: PrepareAxisPaddingArgs & {fixedX?: boolean; fixedY?: boolean[]},
) {
    const {xAxis, yAxis, xScale, yScale, series} = args;
    const padX = !args.fixedX && hasPadding(xAxis);
    const padY = yAxis.map((axis, index) => !args.fixedY?.[index] && hasPadding(axis));
    if (!padX && !padY.some(Boolean)) return;

    const needsAuto = (axis: PreparedAxis) =>
        (axis.min === undefined && axis.padding?.min === 'auto') ||
        (axis.max === undefined && axis.padding?.max === 'auto');
    const points: AxisPaddingPoint[] = [];
    if ((padX && needsAuto(xAxis)) || yAxis.some((axis, index) => padY[index] && needsAuto(axis))) {
        for (const [type, items] of group(series, (s) => s.type)) {
            const contribution = getSeriesPlugin(type).getAxisPadding?.({...args, series: items});
            if (contribution) {
                for (const point of contribution) points.push(point);
            }
        }
    }
    // All measurements use the same original scales; axes can then expand independently.
    if (padX) fitAxis({axis: xAxis, direction: 'x', scale: xScale, series, points});
    const primaryAxes = new Map<PreparedYAxis, PreparedYAxis>();
    for (const [primary, secondary] of clusterYAxes(yAxis)) {
        if (secondary) primaryAxes.set(secondary, primary);
    }
    const changedAxes = new Set<PreparedYAxis>();
    yAxis.forEach((axis, index) => {
        const scale = yScale[index];
        if (!scale || args.fixedY?.[index]) return;
        const primary = primaryAxes.get(axis);
        const primaryIndex = primary ? yAxis.indexOf(primary) : -1;
        const primaryScale = yScale[primaryIndex];
        const syncWithPrimary =
            primary &&
            primaryScale &&
            axis.min === undefined &&
            axis.max === undefined &&
            (axis.type === 'linear' || axis.type === 'logarithmic') &&
            shouldSyncAxisWithPrimary(axis, primary);
        const syncTicks = Boolean(syncWithPrimary && changedAxes.has(primary));
        if (!padY[index] && !syncTicks) return;
        const primaryTicksCount = syncWithPrimary
            ? getAutomaticTickValues({
                  axis: primary,
                  scale: primaryScale,
                  labelLineHeight: primary.labels.lineHeight,
                  series: series.filter((s) => ('yAxis' in s ? s.yAxis : 0) === primaryIndex),
              }).length
            : undefined;
        const previousDomain = scale.domain().map(Number);
        fitAxis({
            axis,
            direction: 'y',
            scale,
            series: series.filter((s) => ('yAxis' in s ? s.yAxis : 0) === index),
            points: points.filter((p) => p.yAxis === index),
            primaryTicksCount,
            syncTicks,
        });
        if (scale.domain().some((value, i) => Number(value) !== previousDomain[i]))
            changedAxes.add(axis);
    });
}
