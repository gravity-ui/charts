import {group} from 'd3-array';

import type {ChartSeries} from '../../types';

import type {GetLayersArgs, SeriesLayer} from './plugin';
import {getSeriesPlugin} from './seriesRegistry';
import type {PreparedSeries} from './types';

export function getSingleSeriesLayer<TSeries extends ChartSeries | PreparedSeries>({
    series,
}: GetLayersArgs<TSeries>): SeriesLayer<TSeries>[] {
    return series.length ? [{key: series[0].type, series}] : [];
}

export function getSeriesLayers<TSeries extends ChartSeries | PreparedSeries>(
    series: readonly TSeries[],
    getSeriesKey: (series: TSeries, index: number) => string,
): SeriesLayer<TSeries>[] {
    const byPlugin = group(
        series.map((item, index) => ({item, index})),
        ({item}) => item.type,
    );
    const layers: {layer: SeriesLayer<TSeries>; index: number}[] = [];
    for (const [type, entries] of byPlugin) {
        // Track occurrences too: a raw series object may appear more than once in the config.
        const positions = new Map<TSeries, number[]>();
        for (let index = entries.length - 1; index >= 0; index--) {
            const entry = entries[index];
            const indices = positions.get(entry.item) ?? [];
            indices.push(entry.index);
            positions.set(entry.item, indices);
        }
        const pluginLayers = getSeriesPlugin(type).getLayers({
            series: entries.map(({item}) => item),
            getSeriesKey: (item, index) => getSeriesKey(item, entries[index].index),
        });
        for (const layer of pluginLayers) {
            let index = Infinity;
            for (const item of layer.series) {
                index = Math.min(index, positions.get(item)!.pop()!);
            }
            layers.push({layer, index});
        }
    }
    return layers.sort((a, b) => a.index - b.index).map(({layer}) => layer);
}
