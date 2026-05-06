import type {SeriesPlugin} from '~core/series/plugin';

import type {SankeySeries} from '../../types';

import {prepareSankeySeries} from './prepare';

export const sankeyPlugin: SeriesPlugin<SankeySeries> = {
    type: 'sankey',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareSankeySeries({series: series as SankeySeries[], seriesOptions, legend, colorScale}),
};
