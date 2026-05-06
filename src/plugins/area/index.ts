import type {SeriesPlugin} from '~core/series/plugin';

import type {AreaSeries} from '../../types';

import {prepareArea} from './prepare';

export const areaPlugin: SeriesPlugin<AreaSeries> = {
    type: 'area',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareArea({series: series as AreaSeries[], seriesOptions, legend, colorScale}),
};
