import type {SeriesPlugin} from '~core/series/plugin';

import type {TreemapSeries} from '../../types';

import {prepareTreemap} from './prepare';

export const treemapPlugin: SeriesPlugin<TreemapSeries> = {
    type: 'treemap',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareTreemap({series: series as TreemapSeries[], seriesOptions, legend, colorScale}),
};
