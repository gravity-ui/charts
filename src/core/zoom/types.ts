/**
 * Defines the zoom state for the chart.
 */
export interface ZoomState {
    /**
     * The range for the X-axis.
     * The first element is the minimum value on the axis (if the axis type is `linear`, `logarithmic`, or `datetime`)
     * or the category index from the categories array specified in the axis settings (if the axis type is `category`).
     * The second element is the corresponding maximum value.
     */
    x: [number, number];
    /**
     * An array of ranges for the Y-axes.
     * For each range, the first element is the minimum value on the axis (if the axis type is `linear`, `logarithmic`, or `datetime`)
     * or the category index from the categories array specified in the axis settings (if the axis type is `category`).
     * The second element is the corresponding maximum value.
     */
    y: ([number, number] | undefined)[];
}
