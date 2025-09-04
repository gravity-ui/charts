/**
 * Configuration options for chart zooming functionality using area selection.
 * Working with only axis related series.
 */
export interface ChartZoom {
    /**
     * Type of zoom to apply.
     * - `x`: zoom only on X axis
     * - `y`: zoom only on Y axis
     * - `xy`: zoom on both X and Y axes
     */
    type: 'x' | 'y' | 'xy';
    /**
     * Zoom brush configuration.
     */
    brush?: {
        style?: {
            fill?: string;
            fillOpacity?: number;
        };
    };
    // TODO: add resetButton configuration
}
