import type {SeriesPlugin} from '~core/series/plugin';

import type {RadarSeries} from '../../types';

import {prepareRadarSeries} from './prepare';

export const radarPlugin: SeriesPlugin<RadarSeries> = {
    type: 'radar',
    prepareSeries: ({series, seriesOptions, legend, colors}) =>
        prepareRadarSeries({series: series as RadarSeries[], seriesOptions, legend, colors}),
};
