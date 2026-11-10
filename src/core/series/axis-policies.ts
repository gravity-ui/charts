import {group} from 'd3-array';

import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {ChartAxisPadding, ChartAxisType, ChartSeries} from '../types';
import {calculateNumericProperty, parseNonNegativeSize} from '../utils/math';
import type {UnknownSeries} from '../utils/series-type-guards';

import type {
    AxisDomainValue,
    AxisTickRequest,
    FixedAxisDomain,
    GetAxisTicksArgs,
    SeriesAxis,
} from './axis-contract';
import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeries} from './types';

export interface AxisSeriesGroup<TSeries> {
    series: readonly TSeries[];
    axis?: SeriesAxis<TSeries>;
}

export interface AxisRequirements {
    bandPadding: number;
    centerSingleValue: boolean;
    hideGrid: boolean;
    padding: ChartAxisPadding[];
    fixedDomain?: FixedAxisDomain;
}

interface AxisTickOptions {
    getValues(): readonly AxisDomainValue[];
    count?: number;
}

const scalarAxis: SeriesAxis<ChartSeries | PreparedSeries> = {};

export function getSeriesAxis(series: {type: string}, direction: 'x' | 'y') {
    const axes = getSeriesPlugin(series.type).axes;
    if (!axes) return undefined;
    return axes === true ? scalarAxis : (axes[direction] ?? scalarAxis);
}

export function getAxisSeriesGroups(
    series: readonly UnknownSeries[],
    direction: 'x' | 'y',
): AxisSeriesGroup<ChartSeries | PreparedSeries>[] {
    return Array.from(
        group(series, (item) => item.type),
        ([, items]) => ({
            series: items as (ChartSeries | PreparedSeries)[],
            axis: getSeriesAxis(items[0], direction),
        }),
    );
}

/** Merge declarative requirements without exposing other plugins' data to a callback. */
export function mergeAxisRequirements<TSeries>(
    groups: readonly AxisSeriesGroup<TSeries>[],
    direction: 'x' | 'y',
    axisType?: ChartAxisType,
): AxisRequirements {
    const result: AxisRequirements = {
        bandPadding: 0,
        centerSingleValue: groups.length > 0,
        hideGrid: false,
        padding: [],
    };
    for (const {series, axis} of groups) {
        result.centerSingleValue &&= axis?.singleValueDomain === 'center';
        if (!axis) continue;
        if (
            axis.bandPadding !== undefined &&
            (!Number.isFinite(axis.bandPadding) || axis.bandPadding < 0)
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: `Invalid ${direction} axis band padding`,
            });
        }
        result.bandPadding = Math.max(result.bandPadding, axis.bandPadding ?? 0);
        result.hideGrid ||= axis.grid === 'hidden';
        if (axis.padding) result.padding.push(axis.padding);
        const fixed = axis.getFixedDomain?.({series, axis: direction});
        if (!fixed) continue;
        if (!Number.isFinite(fixed.min) || !Number.isFinite(fixed.max) || fixed.min > fixed.max) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: `Invalid fixed ${direction} axis domain`,
            });
        }
        const previous = result.fixedDomain;
        if (
            previous &&
            (previous.min !== fixed.min ||
                previous.max !== fixed.max ||
                (previous.type && fixed.type && previous.type !== fixed.type))
        ) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: `Conflicting fixed ${direction} axis domains`,
            });
        }
        result.fixedDomain = {...fixed, type: previous?.type ?? fixed.type};
    }
    if (
        result.fixedDomain &&
        (result.fixedDomain.type ?? axisType) === 'logarithmic' &&
        result.fixedDomain.min <= 0
    ) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: `Invalid fixed ${direction} axis domain`,
        });
    }
    return result;
}

export function getSeriesAxisRequirements(
    series: readonly UnknownSeries[],
    direction: 'x' | 'y',
    axisType?: ChartAxisType,
) {
    return mergeAxisRequirements(getAxisSeriesGroups(series, direction), direction, axisType);
}

/** Resolve competing defaults in pixels, retaining the original syntax for scale padding. */
export function getAxisPaddingDefaults(
    requirements: AxisRequirements,
    size: number,
): ChartAxisPadding {
    const result: ChartAxisPadding = {};
    for (const side of ['min', 'max'] as const) {
        let largest = -1;
        for (const padding of requirements.padding) {
            const value = padding[side];
            if (value === undefined) continue;
            if (value !== 'auto' && !parseNonNegativeSize(value)) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: `Invalid default axis padding.${side}`,
                });
            }
            const pixels =
                value === 'auto'
                    ? Infinity
                    : (calculateNumericProperty({value, base: Math.max(0, size)}) ?? 0);
            if (pixels > largest) {
                largest = pixels;
                result[side] = value;
            }
        }
    }
    return result;
}

/** Combine candidates in plugin order; a count request limits generated ticks, not explicit values. */
export function getSeriesAxisTicks(
    series: readonly UnknownSeries[],
    direction: 'x' | 'y',
    options: AxisTickOptions,
): AxisTickRequest {
    let values: Set<number> | undefined;
    let count: number | undefined;
    let args: GetAxisTicksArgs | undefined;
    for (const {axis} of getAxisSeriesGroups(series, direction)) {
        if (!axis?.getTicks) continue;
        args ??= {values: options.getValues(), count: options.count};
        const request = axis.getTicks(args);
        if (request?.values) {
            values ??= new Set();
            for (const value of request.values) values.add(value);
        }
        if (request?.count !== undefined) count = Math.min(count ?? Infinity, request.count);
    }
    return {values: values ? [...values] : undefined, count};
}
