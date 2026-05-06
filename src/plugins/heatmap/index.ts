import type {SeriesPlugin} from '~core/series/plugin';

import type {HeatmapSeries} from '../../types';

import {prepareHeatmapSeries} from './prepare';

export const heatmapPlugin: SeriesPlugin<HeatmapSeries> = {
    type: 'heatmap',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareHeatmapSeries({
            series: series as HeatmapSeries[],
            seriesOptions,
            legend,
            colorScale,
        }),
};
