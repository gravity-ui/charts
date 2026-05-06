import type {SeriesPlugin} from '~core/series/plugin';

import type {PieSeries} from '../../types';

import {preparePieSeries} from './prepare';

export const piePlugin: SeriesPlugin<PieSeries> = {
    type: 'pie',
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        preparePieSeries({series: series as PieSeries[], seriesOptions, legend, colors}),
};
