import type {SeriesType} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries, BaseSeriesData} from './base';
import type {ChartLegend, RectLegendSymbolOptions} from './legend';
import type {ChartSeriesRangeSliderOptions} from './series';
export interface BarYSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The `x` value of the bar. Depending on the context , it may represents:
     * - numeric value (for `linear` x axis)
     * - timestamp value (for `datetime` x axis)
     * - x axis category value (for `category` x axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `xAxis.categories`
     */
    x?: string | number | null;
    /**
     * The `y` value of the bar. Depending on the context , it may represents:
     * - numeric value (for `linear` y axis)
     * - timestamp value (for `datetime` y axis)
     * - y axis category value (for `category` y axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `yAxis[0].categories`
     */
    y?: string | number;
    /** Data label value of the bar. If not specified, the x value is used. */
    label?: string | number;
    /** Individual opacity for the bar. */
    opacity?: number;
}

export interface BarYSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SeriesType.BarY;
    data: BarYSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /**
     * The width of the border surrounding each bar.
     *
     * @default 0
     */
    borderWidth?: number;
    /**
     * The color of the border surrounding each bar.
     */
    borderColor?: string;
    /**
     * The corner radius of the border surrounding each bar.
     * @default 0
     */
    borderRadius?: number;
    /** Whether to stack the values of each series on top of each other.
     * Possible values are undefined to disable, "normal" to stack by value or "percent"
     *
     * @default undefined
     * */
    stacking?: 'normal' | 'percent';
    /** This option allows grouping series in a stacked chart */
    stackId?: string;
    /** Whether to group non-stacked columns or to let them render independent of each other.
     * When false columns will be laid out individually and overlap each other.
     *
     * @default true
     * */
    grouping?: boolean;
    dataLabels?: BaseSeries['dataLabels'] & {
        /**
         * Whether to align the data label inside or outside the box.
         * For charts with a percentage stack, it is always true.
         *
         * @default false
         * */
        inside?: boolean;
    };
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /**
     * Specifies how null or undefined values should be handled in the series.
     *
     * - `'skip'`: Omit data points with null values (no bar shown)
     * - `'zero'`: Treat null values as zero
     *
     * @default 'skip'
     */
    nullMode?: 'zero' | 'skip';
    /**
     * Options to configure how this series appears and behaves in the Range Slider component.
     */
    rangeSlider?: ChartSeriesRangeSliderOptions;
}
