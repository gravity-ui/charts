import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData, BaseSeriesLegend} from './base';
import type {SeriesColor} from './gradient';
import type {RectLegendSymbolOptions} from './legend';
import type {ChartSeriesRangeSliderOptions} from './series';

export interface AreaRangeSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** Numeric X value, timestamp, category name, or category index, depending on the X-axis type. */
    x?: string | number;
    /** Lower Y boundary. Must not exceed y1. A null boundary makes the whole point incomplete. */
    y0: number | null;
    /** Upper Y boundary. Must not be less than y0. A null boundary makes the whole point incomplete. */
    y1: number | null;
    /** Optional label formatted with dataLabels.format. Otherwise both boundaries are formatted separately. */
    label?: string | number;
}

/** A band between two Y values at each X position. Incomplete points do not contribute to the Y domain. */
export interface AreaRangeSeries<T = MeaningfulAny> extends BaseSeries<T> {
    type: typeof SERIES_TYPE.AreaRange;
    data: AreaRangeSeriesData<T>[];
    /** Series name used in the legend and tooltip. */
    name: string;
    /** Solid or gradient boundary color, also used for the fill unless fillColor is provided. */
    color?: SeriesColor;
    /** Optional solid or gradient fill override. Defaults to color. */
    fillColor?: SeriesColor;
    /** Fill opacity. @default 0.75 */
    opacity?: number;
    /** Width of both boundary lines in pixels. @default 1 */
    lineWidth?: number;
    /** Per-series legend settings, overriding chart-level settings. */
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Index of the series Y axis. @default 0 */
    yAxis?: number;
    /**
     * Incomplete points create gaps with 'skip'; 'connect' joins the surrounding complete points.
     * @default 'skip'
     */
    nullMode?: 'connect' | 'skip';
    /** Visibility and appearance of this series in the range slider. */
    rangeSlider?: ChartSeriesRangeSliderOptions;
}
