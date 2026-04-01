import type {BaseTextStyle} from './base';

export interface ChartAnnotationLabel {
    /** Annotation text */
    text: string;
    /** Text style. fontColor defaults to 'var(--g-color-text-light-primary)' */
    style?: Partial<BaseTextStyle>;
}

export interface ChartAnnotationPopup {
    /**
     * Background color of the popup.
     * @default 'var(--g-color-base-float-heavy)'
     */
    backgroundColor?: string;
    /**
     * Border radius of the popup.
     * @default 4
     */
    borderRadius?: number;
    /**
     * Distance in pixels between the anchor point and the popup edge along the main axis.
     * The main axis depends on the automatically chosen placement:
     * for top/bottom — vertical distance, for left/right — horizontal distance.
     * @default 5
     */
    offset?: number;
    /**
     * Popup padding. Number or [vertical, horizontal].
     * @default [4, 8]
     */
    padding?: number | [number, number];
}

/** Annotation for a specific data point (line, area) */
export interface ChartPointAnnotation {
    label: ChartAnnotationLabel;
    popup?: ChartAnnotationPopup;
}
