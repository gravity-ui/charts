import type {DashStyle} from 'src/constants';

import type {FormatNumberOptions} from '../formatter';

import type {BaseTextStyle} from './base';

export type ChartAxisType = 'category' | 'datetime' | 'linear' | 'logarithmic';
export type ChartAxisTitleAlignment = 'left' | 'center' | 'right';

export interface ChartAxisLabels {
    /** Enable or disable the axis labels. */
    enabled?: boolean;
    /** The label's pixel distance from the perimeter of the plot area.
     *
     * @default: 10
     */
    margin?: number;
    /** The pixel padding for axis labels, to ensure white space between them.
     *
     * @defaults: 5
     * */
    padding?: number;
    dateFormat?: string;
    numberFormat?: FormatNumberOptions;
    style?: Partial<BaseTextStyle>;
    /** For horizontal axes, enable label rotation to prevent overlapping labels.
     * If there is enough space, labels are not rotated.
     * As the chart gets narrower, it will start rotating the labels -45 degrees. */
    autoRotation?: boolean;
    /** Rotation of the labels in degrees.
     *
     * @default: 0
     */
    rotation?: number;
}

export interface ChartAxis {
    categories?: string[];
    timestamps?: number[];
    type?: ChartAxisType;
    /** The axis labels show the number or category for each tick. */
    labels?: ChartAxisLabels;
    /** The color of the line marking the axis itself. */
    lineColor?: string;
    title?: {
        text?: string;
        /** CSS styles for the title */
        style?: Partial<BaseTextStyle>;
        /** The pixel distance between the axis labels or line and the title.
         *
         * Defaults to 4 for horizontal axes, 8 for vertical.
         * */
        margin?: number;
        /** Alignment of the title. */
        align?: ChartAxisTitleAlignment;
        /** Allows limiting of the contents of a title block to the specified number of lines.
         *  Defaults to 1. */
        maxRowCount?: number;
    };
    /** The minimum value of the axis. If undefined the min value is automatically calculate. */
    min?: number;
    /** The grid lines settings. */
    grid?: {
        /** Enable or disable the grid lines.
         *
         * Defaults to true.
         * */
        enabled?: boolean;
    };
    ticks?: {
        /** Pixel interval of the tick marks. Not applicable to categorized axis.
         * The specified value is only a hint; the interval between ticks can be greater or less depending on the data. */
        pixelInterval?: number;
    };
    /** Padding of the max value relative to the length of the axis.
     * A padding of 0.05 will make a 100px axis 5px longer.
     *
     * Defaults to 0.05 for Y axis and to 0.01 for X axis.
     * */
    maxPadding?: number;
}

export interface ChartXAxis extends ChartAxis {}

export interface AxisPlotLine {
    /** The position of the line in axis units. */
    value?: number;
    /** The color of the plot line (hex, rgba). */
    color?: string;
    /** Pixel width of the plot line.
     *
     * @default 1
     * */
    width?: number;
    /** Option for line stroke style. */
    dashStyle?: `${DashStyle}`;
    /**
     * Individual opacity for the line.
     *
     * @default 1
     * */
    opacity?: number;
    /** Place the line behind or above the chart. */
    layerPlacement?: 'before' | 'after';
}

export interface ChartYAxis extends ChartAxis {
    /** Axis location.
     * Possible values - 'left' and 'right'.
     * */
    position?: 'left' | 'right';
    /** Property for splitting charts. Determines which area the axis is located in.
     * */
    plotIndex?: number;
    /** An array of lines stretching across the plot area, marking a specific value */
    plotLines?: AxisPlotLine[];
}
