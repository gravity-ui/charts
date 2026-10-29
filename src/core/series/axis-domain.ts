import {group} from 'd3-array';

import type {ChartSeries} from '../types';
import {isAxisRelatedSeries} from '../utils/series-type-guards';
import type {UnknownSeries} from '../utils/series-type-guards';

import type {AxisDomainValue} from './plugin';
import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeries} from './types';

/** Merge plugin contributions without changing group order or point values. */
export function getAxisDomainValues(series: UnknownSeries[], axis: 'x' | 'y'): AxisDomainValue[] {
    const values: AxisDomainValue[] = [];
    for (const [type, items] of group(series, (item) => item.type)) {
        const plugin = getSeriesPlugin(type);
        const contribution = plugin.getAxisDomainValues?.({
            series: items as (ChartSeries | PreparedSeries)[],
            axis,
        });
        if (contribution === undefined) {
            for (const item of items.filter(isAxisRelatedSeries)) {
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

export function hasAxisBaseline(series: UnknownSeries[], axis: 'x' | 'y'): boolean {
    return series.some((item) => getSeriesPlugin(item.type).axisBaseline === axis);
}
