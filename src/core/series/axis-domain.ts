import {extent, group} from 'd3-array';
import get from 'es-toolkit/compat/get';

import {getDatetimeDomain} from '../scales/datetime-domain';
import type {ChartSeries, ChartXAxis, ChartYAxis} from '../types';
import type {UnknownSeries} from '../utils/series-type-guards';
import type {ZoomState} from '../zoom/types';

import type {AxisDomainValue, DomainViewport} from './axis-contract';
import {getAxisSeriesGroups, getSeriesAxis} from './axis-policies';
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
        if (!getSeriesAxis(items[0], axis)) continue;
        const axisData = getSeriesAxis(items[0], axis)?.getData?.({
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
    if (xRange && xAxis?.type === 'datetime') {
        const visible = fallbackSeries.filter((item) => item.visible);
        const values =
            xAxis.timestamps ?? getAxisDomainValues(visible.length ? visible : fallbackSeries, 'x');
        if (values.length) {
            // Match the datetime X scale's data-clipped viewport, using the same axis series.
            xRange = getDatetimeDomain(
                extent(values as number[]) as [number, number],
                xRange[0],
                xRange[1],
            );
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
