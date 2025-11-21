import type {DashStyle, LineCap, SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';
import type {PointMarkerOptions} from './marker';
import type {ChartSeriesRangeSliderOptions} from './series';

export interface LineSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
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
    marker?: {
        states?: {
            normal?: {
                enabled: boolean;
            };
        };
    };
}

export interface LineSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Line;
    data: LineSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /** Pixel width of the graph line.
     *
     * @default 1
     * */
    lineWidth?: number;
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Options for the point markers of line series */
    marker?: PointMarkerOptions;
    /** Option for line stroke style */
    dashStyle?: DashStyle;
    /** Option for line cap style */
    linecap?: `${LineCap}`;
    /** Individual opacity for the line. */
    opacity?: number;
    /** Y-axis index (when using two axes) */
    yAxis?: number;
    /**
     * Specifies how null or undefined values should be handled in the series.
     *
     * - `'connect'`: Connect points across null values (skip nulls in rendering)
     * - `'zero'`: Treat null values as zero
     * - `'skip'`: Omit the data point (creates gap in line)
     *
     * @default 'skip'
     */
    nullMode?: 'connect' | 'zero' | 'skip';
    /**
     * Options to configure how this series appears and behaves in the Range Slider component.
     */
    rangeSlider?: ChartSeriesRangeSliderOptions;
}
