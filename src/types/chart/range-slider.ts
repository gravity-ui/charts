import type {ChartBrush} from './brush';

export interface ChartRangeSlider {
    /**
     * Range slider brush configuration.
     */
    brush?: ChartBrush;
    /**
     * The initial maximum value of the range slider selection (for X axis). If undefined, the selection end is automatically set to the maximum of the X axis interval.
     *
     * Supported only for `linear`, `datetime`, and `logarithmic` X axis scales (not for `category`).
     *
     * The value type depends on the X axis scale:
     * - For `linear` and `logarithmic` axes: numeric value
     * - For `datetime` axes: timestamp (milliseconds since Unix epoch)
     *
     * You can create an open-ended range interval by specifying only one boundary.
     * If `defaultMax` is specified but `defaultMin` is not, the initial range starts from the minimum of the X axis interval.
     */
    defaultMax?: number;
    /**
     * The initial minimum value of the range slider selection (for X axis). If undefined, the selection start is automatically set to the minimum of the X axis interval.
     *
     * Supported only for `linear`, `datetime`, and `logarithmic` X axis scales (not for `category`).
     *
     * The value type depends on the X axis scale:
     * - For `linear` and `logarithmic` axes: numeric value
     * - For `datetime` axes: timestamp (milliseconds since Unix epoch)
     *
     * You can create an open-ended range interval by specifying only one boundary.
     * If `defaultMin` is specified but `defaultMax` is not, the initial range extends to the maximum of the X axis interval.
     */
    defaultMin?: number;
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
