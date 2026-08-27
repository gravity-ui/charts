import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {ChartPointAnnotation} from './annotation';
import type {
    BaseDataLabels,
    BaseSeries,
    BaseSeriesData,
    BaseSeriesLegend,
    CustomFormatContext,
    ValueFormat,
} from './base';
import type {SeriesColor} from './gradient';
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
        /** Fill color of the marker for this point */
        color?: string;
        /** States for a single point marker. */
        states?: {
            /** The normal state of a single point marker. */
            normal?: {
                /**
                 * Enable or disable the point marker.
                 * @default false
                 */
                enabled: boolean;
            };
        };
    };
    /**
     * Annotation displayed near this data point as a bubble with text label and optional marker.
     * Useful for highlighting specific values, events, or adding contextual notes.
     */
    annotation?: ChartPointAnnotation;
}

export type AreaMarkerSymbol = 'circle' | 'square';

export interface AreaMarkerOptions extends PointMarkerOptions {
    symbol?: AreaMarkerSymbol;
}

export interface AreaFormatContext<T = MeaningfulAny> extends CustomFormatContext {
    data: AreaSeriesData<T>;
    /** Value share in the stack. Provided only when `stacking` is `percent`. */
    percentage?: number;
}

export type AreaValueFormat<T = MeaningfulAny> = ValueFormat<AreaFormatContext<T>>;

export interface AreaSeries<T = MeaningfulAny> extends Omit<
    BaseSeries<T>,
    'dataLabels' | 'tooltip'
> {
    type: typeof SERIES_TYPE.Area;
    data: AreaSeriesData<T>[];
    /** The name of the series (used in legend, tooltip etc) */
    name: string;
    /**
     * Whether to stack the values of each series on top of each other.
     * Possible values are undefined to disable, "normal" to stack by value or "percent"
     */
    stacking?: 'normal' | 'percent';
    /** This option allows grouping series in a stacked chart */
    stackId?: string;
    dataLabels?: Omit<BaseDataLabels, 'format'> & {
        /** Formatting settings for labels. Percent stacks provide `percentage` to custom formatters. */
        format?: AreaValueFormat<T>;
    };
    tooltip?: Omit<NonNullable<BaseSeries<T>['tooltip']>, 'valueFormat'> & {
        /** Formatting settings for tooltip values. Percent stacks provide `percentage` to custom formatters. */
        valueFormat?: AreaValueFormat<T>;
    };
    /** The solid or linear-gradient color of the line and the default color of the area fill. */
    color?: SeriesColor;
    /**
     * An optional solid or linear-gradient override for the area fill.
     * When omitted, the area fill inherits `color`.
     */
    fillColor?: SeriesColor;
    /**
     * Fill opacity for the area
     * @default 0.75
     */
    opacity?: number;
    /**
     * Pixel width of the graph line.
     * @default 1
     */
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
     * - `'connect'`: Connect points across null values (skip nulls in rendering). **Not supported with `stacking`.**
     * - `'zero'`: Treat null values as zero
     * - `'skip'`: Omit the data point (creates gap in area)
     * @default 'skip'
     */
    nullMode?: 'connect' | 'zero' | 'skip';
    /**
     * Options to configure how this series appears and behaves in the Range Slider component.
     */
    rangeSlider?: ChartSeriesRangeSliderOptions;
}
