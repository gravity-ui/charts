import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BarSeriesDataLabelPlacementOptions} from './bar-data-labels';
import type {BaseDataLabels, BaseSeries, BaseSeriesData} from './base';
import type {ChartLegendItem, RectLegendSymbolOptions} from './legend';

export interface WaterfallSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /**
     * The `x` value. Depending on the context , it may represents:
     * - numeric value (for `linear` x axis)
     * - timestamp value (for `datetime` x axis)
     * - x axis category value (for `category` x axis). If the type is a string, then it is a category value itself. If the type is a number, then it is the index of an element in the array of categories described in `xAxis.categories`
     */
    x?: string | number;
    /** Signed change in the balance. Subtotals and totals calculate their own value. */
    y?: number | null;
    /** Data label text. Defaults to the change in y or the computed balance for a subtotal or total. */
    label?: string | number;
    /** Individual opacity for the point. */
    opacity?: number;
    /**
     * How the point contributes to the running balance.
     * - `'change'`: Add the signed y value to the balance.
     * - `'subtotal'`: Show the current balance from zero, ignoring y.
     * - `'total'`: Show the current balance from zero. A null y follows the series nullMode.
     */
    role?: 'change' | 'subtotal' | 'total';
    /**
     * Marks a total when role is omitted. If both fields are set, they must agree.
     * @deprecated Replace `total: true` with `role: 'total'`. For `total: false`, omit the flag or use `role: 'change'`.
     */
    total?: boolean;
}

export interface WaterfallSeries<T = MeaningfulAny> extends BaseSeries {
    /** Waterfall series: bars showing successive changes in a running total. */
    type: typeof SERIES_TYPE.Waterfall;
    data: WaterfallSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc). */
    name: string;
    /** Color of total columns. Defaults to the series palette color. */
    color?: string;
    /** Color of positive changes. Defaults to the positive waterfall palette color. */
    positiveColor?: string;
    /** Color of negative changes. Defaults to the negative waterfall palette color. */
    negativeColor?: string;
    dataLabels?: BaseDataLabels & {
        /**
         * Positions to try in order. Labels default to outside the value end.
         * A candidate must fit entirely within the plot. Inside candidates must also fit
         * within the visible column, with `padding` at both ends along the Y axis.
         *
         * - `'auto'`: Try `outside`, then `inside-end`.
         */
        placement?: BarSeriesDataLabelPlacementOptions['placement'];
        /**
         * What to do when none of the configured positions fits. Only applies when `placement` is set.
         * @default 'show'
         */
        placementFallback?: BarSeriesDataLabelPlacementOptions['placementFallback'];
    };
    /** Individual series legend options. Has higher priority than legend options in widget data. */
    legend?: ChartLegendItem & {
        symbol?: RectLegendSymbolOptions;
        /** The legend item text for positive, negative values and totals. */
        itemText?: {
            /** The legend item text for positive values. */
            positive?: string;
            /** The legend item text for negative values. */
            negative?: string;
            /** The legend item text for totals. */
            totals?: string;
        };
    };
    /** Shared presentation for points with role `'subtotal'`. */
    subtotal?: {
        /** Name used in the legend and tooltip. Defaults to `Subtotal`. */
        name?: string;
        /** Column and legend color. Defaults to the resolved total color. */
        color?: string;
        /** Override the legend text or hide the entry while keeping the columns visible. */
        legend?: {
            enabled?: boolean;
            itemText?: string;
        };
        /** Tooltip settings for checkpoints. Unspecified options inherit from the series. */
        tooltip?: BaseSeries['tooltip'];
        /** Label visibility and formatting for checkpoints. Unspecified options inherit from the series. */
        dataLabels?: Pick<BaseDataLabels, 'enabled' | 'format'>;
    };
    /** Lines connecting adjacent waterfall bars. */
    connectors?: {
        /**
         * Whether to display connector lines between bars.
         * @default true
         */
        enabled?: boolean;
    };
    /**
     * Defines how to handle null values in the data.
     *
     * - `'zero'`: Treat null values as zero
     * - `'skip'`: Omit data points with null values (don't render them)
     * @default 'skip'
     */
    nullMode?: 'zero' | 'skip';
}
