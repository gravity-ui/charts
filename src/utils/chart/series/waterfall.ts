import type {PreparedWaterfallSeries} from '../../../hooks';
import type {WaterfallSeriesData} from '../../../types';

export function getWaterfallPointColor(
    point: WaterfallSeriesData,
    series: PreparedWaterfallSeries,
) {
    if (point.color) {
        return point.color;
    }

    if (point.total) {
        return series.color;
    }

    if (Number(point.y) > 0) {
        return series.positiveColor;
    }

    return series.negativeColor;
}

export function getWaterfallPointSubtotal(
    point: WaterfallSeriesData,
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
