import type {SeriesPlugin} from '~core/series/plugin';

import type {XRangeSeries} from '../../types';

import {prepareXRangeSeries} from './prepare';

export const xRangePlugin: SeriesPlugin<XRangeSeries> = {
    type: 'x-range',
    prepareSeries: ({series, seriesOptions, legend, colorScale}) =>
        prepareXRangeSeries({series: series as XRangeSeries[], seriesOptions, legend, colorScale}),
};
