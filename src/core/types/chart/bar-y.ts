import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {
    BaseDataLabels,
    BaseSeries,
    BaseSeriesData,
    BaseSeriesLegend,
    CustomFormatContext,
    PercentageFormatContext,
    ValueFormat,
} from './base';
import type {RectLegendSymbolOptions} from './legend';
import type {StackLabelsOptions} from './series';
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
    /** Individual opacity for the bar. Overrides series opacity. */
    opacity?: number;
}

/**
 * Formatter context. `percentage` is provided only for percent stacking.
 */
export interface BarYFormatContext<T = MeaningfulAny>
    extends CustomFormatContext, PercentageFormatContext {
    data?: BarYSeriesData<T>;
}

export type BarYValueFormat<T = MeaningfulAny> = ValueFormat<BarYFormatContext<T>>;

export interface BarYSeries<T = MeaningfulAny> extends BaseSeries {
    /** Bar-Y series: horizontal bars for values along the Y axis. */
    type: typeof SERIES_TYPE.BarY;
    data: BarYSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /** The main color of the series (hex, rgba) */
    color?: string;
    /**
     * Opacity of the bar fill and border. Does not affect normal data labels.
     * Point opacity takes precedence. Omitted or null values inherit `series.options['bar-y'].opacity` (default 1).
     * @minimum 0
     * @maximum 1
     */
    opacity?: number | null;
    /**
     * The width of the border surrounding each bar.
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
    /**
     * Whether to stack the values of each series on top of each other.
     * Possible values are undefined to disable, "normal" to stack by value or "percent"
     * Percent stacking supports only non-negative values.
     */
    stacking?: 'normal' | 'percent';
    /** This option allows grouping series in a stacked chart */
    stackId?: string;
    /** Override plugin stack label options. Only enabled series contribute to totals. */
    stackLabels?: StackLabelsOptions;
    /**
     * Whether to group non-stacked columns or to let them render independent of each other.
     * When false columns will be laid out individually and overlap each other.
     * @default true
     */
    grouping?: boolean;
    dataLabels?: Omit<BaseDataLabels, 'format'> & {
        /** Formatting settings for labels. Percent stacks provide `percentage` to custom formatters. */
        format?: BarYValueFormat<T>;
        /**
         * Whether to align the data label inside or outside the box.
         * For charts with a percentage stack, it is always true.
         * @default false
         */
        inside?: boolean;
    };
    tooltip?: Omit<NonNullable<BaseSeries['tooltip']>, 'valueFormat'> & {
        /** Formatting settings for tooltip values. Percent stacks provide `percentage` to custom formatters. */
        valueFormat?: BarYValueFormat<T>;
    };
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /**
     * Specifies how null or undefined values should be handled in the series.
     *
     * - `'skip'`: Omit data points with null values (no bar shown)
     * - `'zero'`: Treat null values as zero
     * @default 'skip'
     */
    nullMode?: 'zero' | 'skip';
}
