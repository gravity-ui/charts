import {getSeriesPlugin} from '../series/seriesRegistry';

export interface UnknownSeries {
    type: string;
    data: unknown;
}

/**
 * Checks whether the series should be drawn with axes.
 * @param series - The series object to check.
 * @returns `true` if the series should be drawn with axes, `false` otherwise.
 */
export function isAxisRelatedSeries(series: UnknownSeries) {
    return Boolean(getSeriesPlugin(series.type).axes);
}
