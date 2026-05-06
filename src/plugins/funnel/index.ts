import type {SeriesPlugin} from '~core/series/plugin';

import type {FunnelSeries} from '../../types';

import {prepareFunnelSeries} from './prepare';

export const funnelPlugin: SeriesPlugin<FunnelSeries> = {
    type: 'funnel',
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        prepareFunnelSeries({series: series as FunnelSeries[], seriesOptions, legend, colors}),
};
