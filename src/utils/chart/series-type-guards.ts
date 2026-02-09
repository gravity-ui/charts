import type {ChartSeries} from '../../types';

const CHARTS_WITHOUT_AXIS: ChartSeries['type'][] = ['pie', 'treemap', 'sankey', 'radar', 'funnel'];

export type UnknownSeries = {type: ChartSeries['type']; data: unknown};

/**
 * Checks whether the series should be drawn with axes.
 *
 * @param series - The series object to check.
 * @returns `true` if the series should be drawn with axes, `false` otherwise.
 */
export function isAxisRelatedSeries(series: UnknownSeries) {
    return !CHARTS_WITHOUT_AXIS.includes(series.type);
}

export function isSeriesWithNumericalXValues(series: UnknownSeries): series is {
    type: ChartSeries['type'];
    data: {x: number}[];
} {
    return isAxisRelatedSeries(series);
}

export function isSeriesWithNumericalYValues(series: UnknownSeries): series is {
    type: ChartSeries['type'];
    data: {y: number}[];
} {
    return isAxisRelatedSeries(series);
}

export function isSeriesWithCategoryValues(series: UnknownSeries): series is {
    type: ChartSeries['type'];
    data: {category: string}[];
} {
    return isAxisRelatedSeries(series);
}
