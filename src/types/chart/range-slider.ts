import type {ChartBrush} from './brush';

export interface ChartRangeSlider {
    brush?: ChartBrush;
    /**
     * Enables/disables the display of range slider
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
