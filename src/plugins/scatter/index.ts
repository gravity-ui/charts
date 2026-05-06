import type {SeriesPlugin} from '~core/series/plugin';

import type {ScatterSeries} from '../../types';

import {prepareScatterSeries} from './prepare';

export const scatterPlugin: SeriesPlugin<ScatterSeries> = {
    type: 'scatter',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareScatterSeries({
            series: series as ScatterSeries[],
            seriesOptions,
            legend,
            colorScale,
        }),
};
