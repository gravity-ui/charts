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

/** Default annotation settings applied to all data points in a series */
export interface ChartAnnotationSeriesOptions {
    /** Default label style for annotations */
    label?: Omit<ChartAnnotationLabel, 'text'>;
    /** Default popup settings for annotations */
    popup?: ChartAnnotationPopup;
}

/** Annotation for a specific data point. Renders as a popup with text label near the data point. */
export interface ChartPointAnnotation {
    /** Text content and style of the annotation */
    label: ChartAnnotationLabel;
    /** Visual settings for the annotation popup container (background, padding, etc.) */
    popup?: ChartAnnotationPopup;
}
