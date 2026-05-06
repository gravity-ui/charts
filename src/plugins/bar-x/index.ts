import type {SeriesPlugin} from '~core/series/plugin';

import type {BarXSeries} from '../../types';

import {prepareBarXSeries} from './prepare';

export const barXPlugin: SeriesPlugin<BarXSeries> = {
    type: 'bar-x',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareBarXSeries({series: series as BarXSeries[], seriesOptions, legend, colorScale}),
};
