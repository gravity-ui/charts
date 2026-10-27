import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BarSeriesDataLabelPlacementOptions} from './bar-data-labels';
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
import type {BarStackLabelsOptions} from './series';
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
    /**
     * Numeric contribution when `stackLabels.valueSource` is 'custom'.
     * Omitted or null values do not contribute; zero is included. Independent of `label`.
     */
    stackLabelValue?: number | null;
    /**
     * Individual opacity for the bar. Omitted or null values inherit series opacity.
     * @minimum 0
     * @maximum 1
     */
    opacity?: number | null;
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
     * The inactive state's opacity multiplies the resolved bar opacity.
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
    stackLabels?: BarStackLabelsOptions;
    /**
     * Whether to place bars or stacks side by side.
     * When false, bars share the category center without taking up grouped slots.
     * Stacking within each stackId is preserved; non-stacked bars start at the value-axis
     * baseline. All series in the same stack must use the same grouping value; omitted
     * grouping means true. Set false on all series in a stack to overlay the whole stack.
     * Later series cover earlier ones, including their borders.
     * @default true
     */
    grouping?: boolean;
    /**
     * Padding as a fraction of the allocated bar slot. Larger values make thinner bars,
     * centered in the same slot. Must be a finite number in [0, 1].
     * Inherits `series.options['bar-y'].barPadding` (default 0.2).
     * Stacks use the largest resolved padding among all their series, including hidden ones.
     * Padding is applied before barMaxWidth and minimum thickness limits.
     * @minimum 0
     * @maximum 1
     */
    barPadding?: number;
    /**
     * Maximum bar thickness in pixels.
     * Must be a finite number greater than or equal to 1. Inherits `series.options['bar-y'].barMaxWidth`
     * (default 50). Stacks use the smallest resolved limit, including hidden series.
     * Applied after barPadding; the minimum rendered thickness is 1 pixel.
     * @minimum 1
     */
    barMaxWidth?: number;
    dataLabels?: Omit<BaseDataLabels, 'format'> &
        BarSeriesDataLabelPlacementOptions & {
            /** Formatting settings for labels. Percent stacks provide `percentage` to custom formatters. */
            format?: BarYValueFormat<T>;
            /**
             * Whether to align the data label inside or outside the box.
             * For percent stacks, labels are centered inside when `placement` is omitted.
             * Ignored when `placement` is set.
             * @deprecated Use `placement` instead.
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
