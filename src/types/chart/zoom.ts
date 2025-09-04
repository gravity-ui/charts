/**
 * Configuration options for chart zooming functionality using area selection.
 */
export interface ChartZoom {
    /**
     * Enable or disable zooming functionality.
     * @default true
     */
    enabled?: boolean;
    /**
     * Type of zoom to apply.
     * - `x`: zoom only on X axis
     * - `y`: zoom only on Y axis
     * - `xy`: zoom on both X and Y axes
     * @default 'xy'
     */
    type?: 'x' | 'y' | 'xy';

    /**
     * Configuration for the reset zoom button.
     */
    // resetButton?: {
    //     /**
    //      * Position of the reset button.
    //      * Note: Adjusting position values might cause overlap with chart elements.
    //      * Ensure coordinates do not obstruct other components or data visibility.
    //      */
    //     position?: {
    //         /**
    //          * X offset from the alignment point in pixels.
    //          * @default -10
    //          */
    //         x?: number;

    //         /**
    //          * Y offset from the alignment point in pixels.
    //          * @default 10
    //          */
    //         y?: number;
    //     };
    // };

    /**
     * Zoom brush configuration.
     */
    brush?: {
        style?: {
            fill?: string;
            fillOpacity?: number;
        };
    };
}
