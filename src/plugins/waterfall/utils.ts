import type {WaterfallSeriesData} from '../../types';

import type {PreparedWaterfallSeries} from './prepared-series';

export function getWaterfallPointColor(
    point: WaterfallSeriesData,
    series: PreparedWaterfallSeries,
) {
    if (point.color) {
        return point.color;
    }

    return series.color;
}
