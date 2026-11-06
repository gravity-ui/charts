import {extent, group} from 'd3-array';
import get from 'es-toolkit/compat/get';

import {getDatetimeDomain} from '../scales/datetime-domain';
import type {ChartSeries, ChartXAxis, ChartYAxis} from '../types';
import type {UnknownSeries} from '../utils/series-type-guards';
import type {ZoomState} from '../zoom/types';

import type {AxisDomainValue, DomainViewport} from './axis-contract';
import {getAxisSeriesGroups, getSeriesAxis, getSeriesAxisRequirements} from './axis-policies';
import type {AxisSeriesGroup} from './axis-policies';
import type {PreparedSeries} from './types';

interface DomainOptions {
    viewport?: DomainViewport;
    fallbackSeries?: readonly UnknownSeries[];
}

interface ScalarAxisPoint {
    x?: AxisDomainValue;
    y?: AxisDomainValue;
    category?: string;
}

/** Coordinates for category selection and tick counts, independent of stacks and geometry extents. */
export function getAxisCoordinateValues(
    series: readonly UnknownSeries[],
    direction: 'x' | 'y',
    categories?: readonly string[],
): AxisDomainValue[] {
    return collectAxisCoordinateValues(
        getAxisSeriesGroups(series, direction),
        direction,
        categories,
    );
}

export function collectAxisCoordinateValues<TSeries>(
    groups: readonly AxisSeriesGroup<TSeries>[],
    direction: 'x' | 'y',
    categories?: readonly string[],
): AxisDomainValue[] {
    const values: AxisDomainValue[] = [];
    for (const {series: items, axis} of groups) {
        if (!axis) continue;
        const contribution = axis.getData?.({series: items, axis: direction})?.values;
        if (contribution) {
            for (const value of contribution) values.push(value);
        } else {
            for (const item of items) {
                const data: unknown = get(item, 'data');
                if (!Array.isArray(data)) continue;
                for (const point of data as readonly (ScalarAxisPoint | undefined)[]) {
                    const value = point?.[direction];
                    values.push(
                        categories && typeof value !== 'number' && typeof value !== 'string'
                            ? point?.category || undefined
                            : value,
                    );
                }
            }
        }
    }
    if (!categories) return values;
    return values.map((value) => {
        const category = typeof value === 'number' ? categories[value] : value;
        if (category === undefined || category === null) {
            throw new Error('It seems you are trying to get non-existing category value');
        }
        return category;
    });
}

/** Merge plugin contributions without changing group order or point values. */
export function getAxisDomainValues(
    series: readonly UnknownSeries[],
    axis: 'x' | 'y',
    options?: DomainOptions,
): AxisDomainValue[] {
    const values: AxisDomainValue[] = [];
    const fallbackGroups = options?.fallbackSeries
        ? group(options.fallbackSeries, (item) => item.type)
        : undefined;
    for (const [type, items] of group(series, (item) => item.type)) {
        const seriesAxis = getSeriesAxis(items[0], axis);
        if (!seriesAxis) continue;
        const axisData = seriesAxis.getData?.({
            series: items as (ChartSeries | PreparedSeries)[],
            axis,
            viewport: options?.viewport,
        });
        const contribution =
            axisData?.domainValues ?? (fallbackGroups ? undefined : axisData?.values);
        if (contribution === undefined) {
            const fallback = fallbackGroups ? (fallbackGroups.get(type) ?? []) : items;
            for (const value of getAxisCoordinateValues(fallback, axis)) values.push(value);
        } else {
            for (const value of contribution) values.push(value);
        }
    }

    // Preserve the existing asymmetry: only X contributions exclude null values.
    return [...new Set(axis === 'x' ? values.filter((value) => value !== null) : values)];
}

/** Collect each Y axis once; layout and label measurement reuse these values. */
export function collectYAxisDomainValues(args: {
    series: PreparedSeries[];
    fallbackSeries: PreparedSeries[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
    zoomState: Partial<ZoomState>;
}): AxisDomainValue[][] | undefined {
    const {series, fallbackSeries, xAxis, yAxis, zoomState} = args;
    if (!zoomState.x && !zoomState.y) return undefined;

    let xRange = zoomState.x;
    if (xRange && xAxis?.type !== 'category') {
        const visible = fallbackSeries.filter((item) => item.visible);
        const axisSeries = visible.length ? visible : fallbackSeries;
        const requirements = getSeriesAxisRequirements(axisSeries, 'x');
        if (
            xAxis?.type === 'datetime' ||
            (requirements.centerSingleValue && !requirements.fixedDomain)
        ) {
            const values =
                (xAxis?.type === 'datetime' ? xAxis.timestamps : undefined) ??
                getAxisDomainValues(axisSeries, 'x');
            if (values.length) {
                const domain = extent(values as number[]) as [number, number];
                if (xAxis?.type === 'datetime') {
                    xRange = getDatetimeDomain(domain, xRange[0], xRange[1]);
                } else if (domain[0] === domain[1]) {
                    // A centered X domain uses neighbor-based projection; preserve its sample Y domain.
                    xRange = domain;
                }
            }
        }
    }

    const select = (items: PreparedSeries[], index: number) => {
        const assigned = items.filter(
            (item) => ('yAxis' in item ? (item.yAxis ?? 0) : 0) === index,
        );
        const visible = assigned.filter((item) => item.visible);
        return visible.length ? visible : assigned;
    };

    return (yAxis ?? [{}]).map((axis, index) =>
        getAxisDomainValues(select(series, index), 'y', {
            fallbackSeries: select(fallbackSeries, index),
            viewport: {
                x: {
                    type: xAxis?.type ?? 'linear',
                    range: xRange,
                    categories: xAxis?.categories,
                },
                y: {
                    type: axis.type ?? 'linear',
                    range: zoomState.y?.[index],
                    categories: axis.categories,
                },
            },
        }),
    );
}

export function hasAxisBaseline(series: UnknownSeries[], axis: 'x' | 'y'): boolean {
    return series.some((item) => getSeriesAxis(item, axis)?.baseline === 0);
}
