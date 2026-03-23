export const ZOOM_TYPE = {
    X: 'x',
    XY: 'xy',
    Y: 'y',
} as const;

export type ZoomType = (typeof ZOOM_TYPE)[keyof typeof ZOOM_TYPE];
