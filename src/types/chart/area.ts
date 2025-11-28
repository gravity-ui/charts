import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData, BaseSeriesLegend} from './base';
import type {RectLegendSymbolOptions} from './legend';
import type {PointMarkerOptions} from './marker';
import type {ChartSeriesRangeSliderOptions} from './series';

export interface AreaSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The `x` value of the point. Depending on the context , it may represents:
     * - numeric value (for `linear` x axis)
     * - timestamp value (for `datetime` x axis)
     * - x axis category value (for `category` x axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `xAxis.categories`
     */
    x?: string | number;
    /**
     * The `y` value of the point. Depending on the context , it may represents:
     * - numeric value (for `linear` y axis)
     * - timestamp value (for `datetime` y axis)
     * - y axis category value (for `category` y axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `yAxis[0].categories`
     */
    y?: string | number | null;
    /** Data label value of the point. If not specified, the y value is used. */
    label?: string | number;
    /** Individual marker options for the point. */
    marker?: {
        /** States for a single point marker. */
        states?: {
            /** The normal state of a single point marker. */
            normal?: {
                /**
                 * Enable or disable the point marker.
                 *
                 * @default false
                 * */
                enabled: boolean;
            };
        };
    };
}

export type AreaMarkerSymbol = 'circle' | 'square';

export interface AreaMarkerOptions extends PointMarkerOptions {
    symbol?: AreaMarkerSymbol;
}

export interface AreaSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Area;
    data: AreaSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** Whether to stack the values of each series on top of each other.
     * Possible values are undefined to disable, "normal" to stack by value or "percent"
     *
     * @default undefined
     * */
    stacking?: 'normal' | 'percent';
    /** This option allows grouping series in a stacked chart */
    stackId?: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /** Fill opacity for the area
     *
     * @default 0.75
     * */
    opacity?: number;
    /** Pixel width of the graph line.
     *
     * @default 1
     * */
    lineWidth?: number;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Options for the point markers of line in area series */
    marker?: AreaMarkerOptions;
    /** Y-axis index (when using two axes) */
    yAxis?: number;
    /**
     * Specifies how null or undefined values should be handled in the series.
     *
     * - `'connect'`: Connect points across null values (skip nulls in rendering)
     * - `'zero'`: Treat null values as zero
     * - `'skip'`: Omit the data point (creates gap in area)
     *
     * @default 'skip'
     */
    nullMode?: 'connect' | 'zero' | 'skip';
    /**
     * Options to configure how this series appears and behaves in the Range Slider component.
     */
    rangeSlider?: ChartSeriesRangeSliderOptions;
}
