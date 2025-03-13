import type {SeriesType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';

/**
 * Boxplot data point structure
 * Represents the five-number summary: minimum, first quartile (Q1), median, third quartile (Q3), and maximum
 */
export interface BoxplotSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The category or x-value for this box
     */
    x?: string | number;

    /**
     * The minimum value (bottom whisker)
     */
    low: number;

    /**
     * The first quartile (Q1, 25th percentile)
     */
    q1: number;

    /**
     * The median (Q2, 50th percentile)
     */
    median: number;

    /**
     * The third quartile (Q3, 75th percentile)
     */
    q3: number;

    /**
     * The maximum value (top whisker)
     */
    high: number;

    /**
     * Optional array of outlier values that fall outside the whiskers
     */
    outliers?: number[];
}

export interface BoxplotSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SeriesType.Boxplot;
    data: BoxplotSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Y-axis index (when using two axes) */
    yAxis?: number;
    /** Width of the box as a percentage of the available width (0-1) */
    boxWidth?: number;
    /** Width of the whisker caps as a percentage of the box width (0-1) */
    whiskerWidth?: number;
    /** Whether to show outliers */
    showOutliers?: boolean;
    /** Radius of outlier points */
    outlierRadius?: number;
}
