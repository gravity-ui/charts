import type {SeriesPlugin} from '~core/series/plugin';

import type {WaterfallSeries} from '../../types';

import {prepareWaterfallSeries} from './prepare';

export const waterfallPlugin: SeriesPlugin<WaterfallSeries> = {
    type: 'waterfall',
    prepareSeries: ({series, legend, colorScale, colors}) =>
        prepareWaterfallSeries({series: series as WaterfallSeries[], legend, colorScale, colors}),
};
