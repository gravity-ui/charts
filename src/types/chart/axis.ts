import type {DurationInput} from '@gravity-ui/date-utils';

import type {AXIS_TYPE, DashStyle} from '../../constants';
import type {FormatNumberOptions} from '../formatter';

import type {BaseTextStyle} from './base';
import type {ChartBrush} from './brush';

export type ChartAxisType = (typeof AXIS_TYPE)[keyof typeof AXIS_TYPE];
export type ChartAxisTitleAlignment = 'left' | 'center' | 'right';

export interface ChartAxisLabels {
    /** Enable or disable the axis labels. */
    enabled?: boolean;
    /** The label's pixel distance from the perimeter of the plot area.
     * @default 10
     */
    margin?: number;
    /** The pixel padding for axis labels, to ensure white space between them.
     * @default 5
     */
    padding?: number;
    dateFormat?: string;
    numberFormat?: FormatNumberOptions;
    style?: Partial<BaseTextStyle>;
    /** For horizontal axes, enable label rotation to prevent overlapping labels.
     * If there is enough space, labels are not rotated.
     * As the chart gets narrower, it will start rotating the labels -45 degrees.
     *
     * Does not apply to html labels.
     */
    autoRotation?: boolean;
    /** Rotation of the labels in degrees.
     *
     * Does not apply to html labels.
     * @default 0
     */
    rotation?: number;
    /**
     * Allows to use any html-tags to display labels content. Supports only for axis with type "category".
     * @default false
     * */
    html?: boolean;
    /** The maximum width of the axis labels(absolute or relative to the chart area).
     * If more than that, it collapses into three points.
     * */
    maxWidth?: number | string;
}

export interface ChartAxisRangeSlider {
    /**
     * Range slider brush configuration.
     */
    brush?: ChartBrush;
    /**
     * Configuration for the range slider state after the initial chart render.
     */
    defaultRange?: {
        /**
         * Default size of the range slider.
         *
         * The value type depends on the axis scale:
         * - For `datetime` axes: {@link https://github.com/gravity-ui/date-utils/blob/8d53ff16a4582831140e75f1305dc6a0112a5ad6/src/typings/duration.ts#L7 DurationInput}
         * - For `linear` and `logarithmic` axes: numeric value
         */
        size?: DurationInput | number;
    };
    /**
     * Enable or disable the display of range slider
     * @default false
     */
    enabled?: boolean;
    /**
     * The height of the range slider in pixels.
     * @default 40
     */
    height?: number;
    /**
     * The pixel distance between the range slider and the the X axis or X axis labels.
     * @default 10
     */
    margin?: number;
}

export interface ChartAxisTitle {
    text?: string;
    /** CSS styles for the title */
    style?: Partial<BaseTextStyle>;
    /** The pixel distance between the axis labels or line and the title.
     * @default 4 for horizontal axes, 8 for vertical
     */
    margin?: number;
    /** Alignment of the title. */
    align?: ChartAxisTitleAlignment;
    /** Allows limiting of the contents of a title block to the specified number of lines.
     * @default 1
     */
    maxRowCount?: number;
}

export interface ChartAxis {
    categories?: string[];
    /** Configure a crosshair that follows either the mouse pointer or the hovered point. */
    crosshair?: AxisCrosshair;
    timestamps?: number[];
    type?: ChartAxisType;
    /** The axis labels show the number or category for each tick. */
    labels?: ChartAxisLabels;
    /** The color of the line marking the axis itself. */
    lineColor?: string;
    title?: ChartAxisTitle;
    /**
     * The minimum value of the axis. If undefined the min value is automatically calculated.
     *
     * The value type depends on the axis scale:
     * - For `linear` and `logarithmic` axes: numeric value
     * - For `datetime` axes: timestamp (milliseconds since Unix epoch)
     * - For `category` axes: index of the element in the categories array (which has been processed according to the specified `order` property)
     *
     * Note: min/max is not supported for category axes in waterfall and heatmap visualizations.
     */
    min?: number;
    /**
     * The maximum value of the axis. If undefined the max value is automatically calculated.
     *
     * The value type depends on the axis scale:
     * - For `linear` and `logarithmic` axes: numeric value
     * - For `datetime` axes: timestamp (milliseconds since Unix epoch)
     * - For `category` axes: index of the element in the categories array (which has been processed according to the specified `order` property)
     *
     * Note: min/max is not supported for category axes in waterfall and heatmap visualizations.
     */
    max?: number;
    /** The grid lines settings.
     * Unavailable for some visualizations, such as a heatmap.
     */
    grid?: {
        /** Enable or disable the grid lines.
         * @default true
         */
        enabled?: boolean;
    };
    ticks?: {
        /** Pixel interval of the tick marks. Not applicable to categorized axis.
         * The specified value is only a hint; the interval between ticks can be greater or less depending on the data.
         *
         * @deprecated use `interval` instead
         * */
        pixelInterval?: number;
        /** Interval of the tick marks(absolute or relative to the chart area). Not applicable to categorized axis.
         * The specified value is only a hint; the interval between ticks can be greater or less depending on the data. */
        interval?: number | string;
    };
    /** Padding of the max value relative to the length of the axis.
     * A padding of 0.05 will make a 100px axis 5px longer.
     * Does not apply for series with data normalization along on a specific axis (stacking: 'percent').
     * @default 0.05 for Y axis, 0.01 for X axis
     */
    maxPadding?: number;
    /** An array of lines stretching across the plot area, marking a specific value */
    plotLines?: AxisPlotLine[];
    /** An array of colored bands stretching across the plot area marking an interval on the axis. */
    plotBands?: AxisPlotBand[];
    /** Whether axis, including axis title, line, ticks and labels, should be visible. */
    visible?: boolean;
    /** Setting the order of the axis values. It is not applied by default.
     * the "reverse" value is needed to use the reverse order without sorting
     */
    order?: 'sortAsc' | 'sortDesc' | 'reverse';
}

export interface ChartXAxis extends ChartAxis {
    /**
     * Configuration options for the chart range slider component.
     *
     * The range slider allows users to select a specific range of data to display
     * on the chart by adjusting the slider handles.
     *
     * Supported only for `linear`, `datetime`, and `logarithmic` axes.
     */
    rangeSlider?: ChartAxisRangeSlider;
}

export type PlotLayerPlacement = 'before' | 'after';

export interface AxisPlot {
    /** Place the line behind or above the chart. */
    layerPlacement?: PlotLayerPlacement;
    /** The color of the plot line (hex, rgba). */
    color?: string;
    /**
     * Individual opacity for the line.
     * @default 1
     * */
    opacity?: number;
    /* Text labels for the plot line/band */
    label?: {
        text: string;
        style?: Partial<BaseTextStyle>;
        /** The pixel padding for label.
         * @default 5
         */
        padding?: number;
    };
}

export interface AxisPlotLine extends AxisPlot {
    /** The position of the line in axis units. */
    value?: number;
    /** The color of the plot line (hex, rgba). */
    color?: string;
    /** Pixel width of the plot line.
     * @default 1
     * */
    width?: number;
    /** Option for line stroke style. */
    dashStyle?: DashStyle;
}

export interface AxisPlotBand extends AxisPlot {
    /**
     * The start position of the plot band in axis units.
     *
     * Can be a number, a string (e.g., a category), or a timestamp if representing a date.
     * When representing a date, the value **must be a timestamp** (number of milliseconds since Unix epoch).
     */
    from: number | string;
    /**
     * The end position of the plot band in axis units.
     *
     * Can be a number, a string (e.g., a category), or a timestamp if representing a date.
     * When representing a date, the value **must be a timestamp** (number of milliseconds since Unix epoch).
     */
    to: number | string;
}

export interface AxisCrosshair extends Omit<AxisPlotLine, 'value' | 'label'> {
    /** Whether the crosshair should snap to the point or follow the pointer independent of points.
     * @default true
     */
    snap?: boolean;
    /** Enable or disable the axis crosshair.
     * @default false
     */
    enabled?: boolean;
}

interface ChartYAxisTitle extends ChartAxisTitle {
    /** Rotation of the title in degrees.
     * Currently, the available values are only for rotation in multiples of 90 degrees.
     *
     * The default values are -90 for the left axis and 90 for the right.
     */
    rotation?: 0 | 90 | -90;
    /** Interval of the tick marks(absolute or relative to the chart area).
     *
     * For a title with rotation = 0, the relative value is calculated based on the chart width, otherwise on the chart height.
     * The default value for the title with rotation: 0 is 20%, for the rest - not defined.
     */
    maxWidth?: number | string;
}

export interface ChartYAxis extends ChartAxis {
    /** Axis location. */
    position?: 'left' | 'right';
    /** Property for splitting charts. Determines which area the axis is located in. */
    plotIndex?: number;
    title?: ChartYAxisTitle;
}
