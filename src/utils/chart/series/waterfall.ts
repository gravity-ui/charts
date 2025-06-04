import type {PreparedWaterfallSeries, PreparedWaterfallSeriesData} from '../../../hooks';
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

export function getWaterfallPointSubtotal(
    point: PreparedWaterfallSeriesData,
    series: PreparedWaterfallSeries,
) {
    const pointIndex = series.data.indexOf(point);

    if (pointIndex === -1) {
        return null;
    }

    return series.data.reduce((sum, d, index) => {
        if (index <= pointIndex) {
            const value = d.total ? 0 : Number(d.y);
            return sum + value;
        }

        return sum;
    }, 0);
}
