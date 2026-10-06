import type {PreparedWaterfallSeries} from '../../../hooks';
import type {WaterfallSeriesData} from '../../../types';

export function getWaterfallPointColor(
    point: WaterfallSeriesData,
    series: PreparedWaterfallSeries,
) {
    if (point.color) {
        return point.color;
    }

    return series.color;
}
