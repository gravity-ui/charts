/* eslint-disable jsdoc/check-tag-names */

export interface GradientStop {
    /**
     * Color of the stop (hex, rgba, named color).
     * @minLength 1
     */
    color: string;
    /**
     * Position of the stop as a value from 0 to 1.
     * @minimum 0
     * @maximum 1
     */
    offset: number;
}

export interface LinearGradient {
    /** Gradient kind. */
    type: 'linear-gradient';
    /**
     * Gradient angle in degrees, following the CSS convention:
     * 0 = bottom to top, 90 = left to right, 180 = top to bottom,
     * 270 = right to left.
     * @default 180
     */
    angle?: number;
    /**
     * Color stops in ascending offset order. At least two stops are required.
     * @minItems 2
     */
    stops: GradientStop[];
}

export type SeriesColor = string | LinearGradient;
