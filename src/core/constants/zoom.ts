export const ZOOM_TYPE = {
    X: 'x',
    XY: 'xy',
    Y: 'y',
} as const;

/**
 * Zoom direction.
 * - `'x'`: Zoom only on the X axis.
 * - `'xy'`: Zoom on both axes.
 * - `'y'`: Zoom only on the Y axis.
 */
export type ZoomType = (typeof ZOOM_TYPE)[keyof typeof ZOOM_TYPE];
