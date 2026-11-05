import {group} from 'd3-array';

import type {ChartSeries, ChartXAxis, ChartYAxis} from '../types';
import {isAxisRelatedSeries} from '../utils/series-type-guards';
import type {UnknownSeries} from '../utils/series-type-guards';
import type {ZoomState} from '../zoom/types';

import type {AxisDomainValue, DomainViewport} from './plugin';
import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeries} from './types';

interface DomainOptions {
    viewport?: DomainViewport;
    /** Scalar fallback keeps the caller's point selection when a plugin delegates to core. */
    fallbackSeries?: UnknownSeries[];
}

/** Merge plugin contributions without changing group order or point values. */
export function getAxisDomainValues(
    series: UnknownSeries[],
    axis: 'x' | 'y',
    options?: DomainOptions,
): AxisDomainValue[] {
    const values: AxisDomainValue[] = [];
    const fallbackGroups = options?.fallbackSeries
        ? group(options.fallbackSeries, (item) => item.type)
        : undefined;
    for (const [type, items] of group(series, (item) => item.type)) {
        const plugin = getSeriesPlugin(type);
        const contribution = plugin.getAxisDomainValues?.({
            series: items as (ChartSeries | PreparedSeries)[],
            axis,
            viewport: options?.viewport,
        });
        if (contribution === undefined) {
            const fallback = fallbackGroups ? (fallbackGroups.get(type) ?? []) : items;
            for (const item of fallback.filter(isAxisRelatedSeries)) {
                for (const point of item.data as {x?: AxisDomainValue; y?: AxisDomainValue}[]) {
                    values.push(point?.[axis]);
                }
            }
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
                    range: zoomState.x,
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
    return series.some((item) => getSeriesPlugin(item.type).axisBaseline === axis);
}
