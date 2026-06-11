import type {DashStyle, SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {
    BaseDataLabels,
    BaseSeries,
    BaseSeriesData,
    BaseSeriesLegend,
    ValueFormat,
} from './base';
import type {ChartLegendItem, RectLegendSymbolOptions} from './legend';

export interface FunnelSeriesData<T = MeaningfulAny> extends BaseSeriesData<T> {
    /** The value of the funnel segment. */
    value: number;
    /** The name of the funnel segment (used in legend, tooltip etc). */
    name: string;
    /** Initial data label of the funnel segment. If not specified, the value is used. */
    label?: string;
    /** Individual opacity for the funnel segment. */
    opacity?: number;
    /** Individual series legend options. Has higher priority than legend options in series data */
    legend?: BaseSeriesLegend & {
        symbol?: RectLegendSymbolOptions;
    };
    /** Tooltip options for this funnel segment. Overrides series-level tooltip options. */
    tooltip?: BaseSeriesData['tooltip'] & {
        /** Formatting settings for tooltip value. */
        valueFormat?: ValueFormat;
    };
}

export interface FunnelSeries<T = MeaningfulAny> extends Omit<BaseSeries, 'dataLabels'> {
    type: typeof SERIES_TYPE.Funnel;
    data: FunnelSeriesData<T>[];
    /** The name of the funnel series. */
    name?: string;
    /** The color of the funnel series. */
    color?: string;
    /**
     * The visual shape of funnel segments.
     *
     * - `'rectangle'` (**recommended**): each segment is an independent rectangle whose
     *   width is directly proportional to its value. The human eye reads width as a linear
     *   scale, making comparisons between segments accurate and effortless.
     *
     * - `'trapezoid'`: adjacent segments are drawn as connected trapezoids, giving the chart
     *   a classic "funnel" silhouette. However, this shape distorts perception: the slanted
     *   sides cause viewers to judge area (which grows as the square of width) rather than
     *   width alone, exaggerating differences between large and small values. Use only for
     *   decorative purposes or when visual familiarity with the funnel metaphor is more
     *   important than analytical precision.
     * @default 'rectangle'
     */
    shape?: 'rectangle' | 'trapezoid';
    /** Lines or areas connecting the funnel segments. */
    connectors?: {
        enabled?: boolean;
        /**
         * The height of the connector area between funnel segments.
         * Accepts a pixel number, a pixel string (e.g. `'10px'`), or a percentage string
         * (e.g. `'25%'`) relative to the segment band height.
         *
         * Defaults to `0` for `'trapezoid'` and `'25%'` for `'rectangle'`.
         */
        height?: string | number;
        /** Option for line stroke style */
        lineDashStyle?: DashStyle;
        /** Opacity for the connector line. Defaults to `0` for `'trapezoid'`, `1` for `'rectangle'`. */
        lineOpacity?: number;
        /** Connector line color. */
        lineColor?: string;
        /** Connector line width in pixels. */
        lineWidth?: number;
        /** Connector area color. */
        areaColor?: string;
        /** Opacity for the connector area fill. Defaults to `0` for `'trapezoid'`, `0.25` for `'rectangle'`. */
        areaOpacity?: number;
    };
    dataLabels?: Omit<BaseDataLabels, 'allowOverlap'> & {
        /**
         * Horizontal alignment of the data labels.
         * @default 'center'
         */
        align?: 'left' | 'center' | 'right';
        /**
         * Whether to align the data label inside or outside the shape.
         * @default false
         */
        inside?: boolean;
        /**
         * Whether to shrink the funnel shapes to reserve space for outside labels.
         * When true, the plot area is inset on the labelled side so labels do not overlap segments.
         * When false, no space is reserved and labels are clamped to the plot area boundary if they overflow.
         * Only relevant when `inside` is false.
         * @default true
         */
        reserveSpace?: boolean;
        /**
         * The reference area for label alignment. Only relevant when `inside` is false.
         *
         * - `'shape'` - aligns relative to the data shape (e.g., funnel section).
         * - `'plot'` - aligns relative to the chart plot area boundaries.
         * @default 'plot'
         */
        anchor?: 'plot' | 'shape';
        /**
         * When enabled, `\n` characters in `label` values are treated as line breaks.
         * For SVG labels each line is rendered as a separate `<tspan>` element.
         * For HTML labels (`html: true`) `white-space: pre-line` is applied so the browser
         * preserves the newlines.
         * @default false
         */
        preserveLineBreaks?: boolean;
    };
    /** Individual series legend options. Has higher priority than legend options in widget data */
    legend?: ChartLegendItem & {
        symbol?: RectLegendSymbolOptions;
    };
}
