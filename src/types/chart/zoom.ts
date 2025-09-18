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
    // TODO: add resetButton configuration
}
