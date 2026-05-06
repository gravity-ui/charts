import type {SeriesPlugin} from '~core/series/plugin';

import type {LineSeries} from '../../types';

import {prepareLineSeries} from './prepare';

export const linePlugin: SeriesPlugin<LineSeries> = {
    type: 'line',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareLineSeries({series: series as LineSeries[], seriesOptions, legend, colorScale}),
};
