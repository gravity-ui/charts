import {group} from 'd3-array';

import type {ChartSeries} from '../../types';

import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeries} from './types';

interface SeriesLayer<TSeries> {
    key: string;
    series: readonly TSeries[];
}

export function getSeriesLayers<TSeries extends ChartSeries | PreparedSeries>(
    series: readonly TSeries[],
    getSeriesKey: (series: TSeries, index: number) => string,
): SeriesLayer<TSeries>[] {
    const layers = group(series, (item, index) =>
        getSeriesPlugin(item.type).getLayerKey({
            series: item,
            seriesKey: getSeriesKey(item, index),
        }),
    );
    return Array.from(layers, ([key, items]) => ({key, series: items}));
}
