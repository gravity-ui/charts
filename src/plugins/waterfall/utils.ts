import type {PreparedWaterfallSeries} from '~core/series/types';

import type {WaterfallSeriesData} from '../../types';

export function getWaterfallPointRole(point: WaterfallSeriesData) {
    return point.role ?? (point.total ? 'total' : 'change');
}

export function getWaterfallPointColor(
    point: WaterfallSeriesData,
    series: PreparedWaterfallSeries,
) {
    if (point.color) {
        return point.color;
    }

    return series.color;
}
