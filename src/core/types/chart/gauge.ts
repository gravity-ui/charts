import type React from 'react';

import type {SERIES_TYPE} from '../../constants';
import type {MeaningfulAny} from '../misc';

import type {BaseSeries} from './base';

/** One colored zone on the arc. The zone spans from the previous stop's value (or min) up to this stop's value. The last stop must equal max. */
export interface ThresholdStop {
    value: number;
    /** Falls back to palette if omitted. */
    color?: string;
    /** Shown in tooltip, e.g. "Critical". */
    label?: string;
}

/** Data passed to custom content renderer callbacks. */
export interface GaugeSeriesArg {
    value: number;
    min: number;
    max: number;
    unit?: string;
    name?: string;
    color: string;
    id: string;
}

/**
 * Slots for injecting arbitrary React content into the gauge layout.
 * 'inner' renders inside the inner circle (center area).
 * 'below' renders below the arc, outside the SVG, in a full-width div.
 */
export interface GaugeCustomContent {
    /** Rendered inside the SVG via a foreignObject in the inner circle. */
    inner?: (series: GaugeSeriesArg) => React.ReactNode;
    /** Rendered in a block div beneath the SVG element. */
    below?: (series: GaugeSeriesArg) => React.ReactNode;
}

export interface ArcConfig {
    /**
     * Total sweep in degrees. 180 = semicircle (default), 270 = three-quarter arc.
     * @default 180
     */
    sweepAngle?: number;
    /**
     * 'discrete' = per-zone segments; 'continuous' = linear gradient.
     * @default 'discrete'
     */
    trackStyle?: 'discrete' | 'continuous';
    /**
     * Track width as fraction of outerRadius (0–1) or absolute px.
     * @default 0.12
     */
    thickness?: number | string;
    /**
     * Rounded caps on arc segments.
     * @default 4
     */
    cornerRadius?: number;
}

export interface PointerConfig {
    /**
     * marker — tick/dot on the arc circumference; frees the entire inner
     *          circle for text and custom content. DEFAULT.
     * needle — classic rotating arrow anchored at center pivot.
     * solid  — filled arc from min to current value (progress-bar style).
     * @default 'marker'
     */
    type?: 'marker' | 'needle' | 'solid';
    /** Defaults to series color. */
    color?: string;
    /**
     * marker: dot diameter in px.           @default 8
     * needle: length as fraction of inner radius (0–1). @default 0.85
     */
    size?: number;
}

/** @default 'clamp' */
export type OverflowBehavior = 'clamp' | 'wrap' | 'extend';

export interface GaugeSeries<T = MeaningfulAny> extends BaseSeries {
    type: typeof SERIES_TYPE.Gauge;

    value: number;
    /** @default 0 */
    min?: number;
    /** @default 100 */
    max?: number;

    /**
     * Colored arc zones. Each stop's value is the zone's upper boundary.
     * Zones: [min, stops[0].value), [stops[0].value, stops[1].value), …
     * The last stop's value should equal max.
     */
    thresholds?: ThresholdStop[];

    /** Renders a secondary marker on the arc at this value (target line). */
    target?: number;

    /** Unit string appended to the primary label, e.g. "°C" or "%". */
    unit?: string;

    /** Custom HTML slots — inside the inner circle and/or below the gauge. */
    customContent?: GaugeCustomContent;

    arc?: ArcConfig;
    pointer?: PointerConfig;

    /** @default 'clamp' */
    overflow?: OverflowBehavior;

    name?: string;
    color?: string;

    legend?: {
        enabled?: boolean;
    };

    /** Unused generic param kept for API consistency. */
    _phantom?: T;
}

export const GAUGE_DEFAULTS = {
    min: 0,
    max: 100,
    arc: {
        sweepAngle: 180,
        trackStyle: 'discrete' as const,
        thickness: 0.12,
        cornerRadius: 4,
    },
    pointer: {
        type: 'marker' as const,
        size: 8,
    },
    overflow: 'clamp' as const,
};
