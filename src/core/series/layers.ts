import {group} from 'd3-array';

import {ChartError} from '../../libs';
import type {ChartSeries} from '../../types';

import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeries} from './types';

interface SeriesLayer<TSeries> {
    key: string;
    series: TSeries[];
}

export function getSeriesLayers<TSeries extends ChartSeries | PreparedSeries>(
    series: readonly TSeries[],
    getSeriesKey: (series: TSeries, index: number) => string,
): SeriesLayer<TSeries>[] {
    const layers = group(
        series,
        (item, index) =>
            getSeriesPlugin(item.type).getLayerKey?.({
                series: item,
                seriesKey: getSeriesKey(item, index),
            }) ?? item.type,
    );
    return Array.from(layers, ([key, items]) => {
        if (items.some((item) => item.type !== items[0].type)) {
            throw new ChartError({
                message: `Layer key "${key}" is shared by different series types`,
            });
        }
        return {key, series: items};
    });
}
