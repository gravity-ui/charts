/**
 * Configuration options for chart zooming functionality using area selection.
 * Working with only axis related series.
 */
export interface ChartZoom {
    enabled?: boolean;
    /**
     * Type of zoom to apply.
     * - `x`: zoom only on X axis
     * - `y`: zoom only on Y axis
     * - `xy`: zoom on both X and Y axes
     *
     * The availability of zoom types depends on the series types used in the chart.
     * If the specified zoom type is not supported by all series, it will be ignored.
     * If no type is specified, a default will be chosen based on the series.
     *
     * Supported zoom types by series type:
     * - `Area`, `Line`, `Scatter`: `x`, `y`, `xy`
     * - `BarX`: `x`
     * - `BarY`: `y`
     *
     * Default zoom type by series type:
     * - `BarY`: `y`
     * - `Scatter`: `xy`
     * - All others: `x`
     */
    type?: 'x' | 'y' | 'xy';
    /**
     * Zoom brush configuration.
     */
    brush?: {
        style?: {
            fillOpacity?: number;
        };
    };
    /**
     * Reset zoom button configuration.
     * The button appears only after the zoom has been applied.
     */
    resetButton?: {
        /**
         * The alignment of the button.
         *
         * @default 'top-right'
         */
        align?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
        /**
         * The offset of the button.
         *
         * @default {x: 0, y: 0}
         */
        offset?: {
            x?: number;
            y?: number;
        };
        /**
         * The box to which the button is positioned relative to.
         * - `chart-box` refers to the entire chart area, including titles and legends.
         * - `plot-box` refers to the area where the series are drawn.
         *
         * @default 'chart-box'
         */
        relativeTo?: 'chart-box' | 'plot-box';
    };
}
