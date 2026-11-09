import type {ChartAxisPadding, ChartAxisType} from '../types';

export type AxisDomainValue = number | string | null | undefined;

export interface DomainAxis {
    type: ChartAxisType;
    /** This axis has no selected region when another plot owns the active brush. */
    excluded?: boolean;
    /** Active zoom/slider bounds; category bounds are indices into categories. */
    range?: readonly [number, number];
    categories?: readonly string[];
}

export interface DomainViewport {
    x: DomainAxis;
    y: DomainAxis;
}

export interface SeriesAxisContext<TSeries> {
    /** This plugin's series for the current axis, in input order. */
    series: readonly TSeries[];
    axis: 'x' | 'y';
}

export interface GetAxisDataArgs<TSeries> extends SeriesAxisContext<TSeries> {
    /** Active window and coordinate systems. Omitted when the view is unfiltered. */
    viewport?: DomainViewport;
}

export interface FixedAxisDomain {
    min: number;
    max: number;
    /** Omit a type constraint; core uses another plugin's explicit type or the configured scale. */
    type?: 'linear' | 'logarithmic';
}

export interface AxisData {
    /** Original coordinates for categories and tick counts. Omit for scalar x/y extraction. */
    values?: readonly AxisDomainValue[];
    /** Geometry extents, stack sums or cumulative values. Omit to use values. */
    domainValues?: readonly AxisDomainValue[];
}

export interface AxisTickRequest {
    /** Candidate values before shared label collision handling. */
    values?: readonly number[];
    /** Requested tick count; simultaneous requests use the smallest count. */
    count?: number;
}

export interface GetAxisTicksArgs {
    /** Merged axis values: X coordinates or Y domain contributions. */
    values: readonly AxisDomainValue[];
    /** Count derived from the user's tick interval, when configured. */
    count?: number;
}

/** Axis behavior expressed without prepared core objects or built-in series unions. */
export interface SeriesAxis<TSeries> {
    /**
     * Optional adapter for this plugin's ordered, axis-selected series. Omit for scalar x/y.
     * Empty arrays exclude contributions. Do not mutate points or filter visibility again.
     */
    getData?(args: GetAxisDataArgs<TSeries>): AxisData | undefined;
    /** Reserve this fraction of a coordinate band at each continuous-domain edge. Defaults to 0. */
    bandPadding?: number;
    /** Center single-coordinate continuous X or datetime Y domains when every series requests it. */
    singleValueDomain?: 'center';
    /** Hide grid lines, including an explicitly enabled grid. Omit to use chart settings. */
    grid?: 'hidden';
    /**
     * Axis padding defaults: numbers/px strings are pixels, percentages use the plot dimension.
     * Core takes the largest resolved request per edge; explicit axis.padding wins.
     */
    padding?: ChartAxisPadding;
    /**
     * Request a zero value-axis baseline on linear scales. Omit for a data-derived baseline.
     * Only zero is supported; this is a coordinate value, not an enable/disable flag.
     * Log scales retain positive headroom instead.
     */
    baseline?: 0;
    /**
     * Fixed numeric bounds override configured limits, zoom, padding and rounding.
     * Equal requests combine; incompatible bounds or scale types throw ChartError.
     */
    getFixedDomain?(args: SeriesAxisContext<TSeries>): FixedAxisDomain | undefined;
    /** Continuous-axis ticks. Omit for shared automatic ticks; explicit axis.ticks.values wins. */
    getTicks?(args: GetAxisTicksArgs): AxisTickRequest | undefined;
}

export interface SeriesAxes<TSeries> {
    /** Optional policies; both axes participate even when their policies are omitted. */
    x?: SeriesAxis<TSeries>;
    y?: SeriesAxis<TSeries>;
}
