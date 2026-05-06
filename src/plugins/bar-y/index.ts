import type {SeriesPlugin} from '~core/series/plugin';

import type {BarYSeries} from '../../types';

import {prepareBarYSeries} from './prepare';

export const barYPlugin: SeriesPlugin<BarYSeries> = {
    type: 'bar-y',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareBarYSeries({series: series as BarYSeries[], seriesOptions, legend, colorScale}),
};
