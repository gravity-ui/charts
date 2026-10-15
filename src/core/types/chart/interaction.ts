import type {BuiltInInteractionItem} from '../../../plugins/interaction-types';
import type {MeaningfulAny} from '../misc';

import type {ChartSeries} from './series';

export type {ChartSankeyLinkPoint} from '../../../plugins/interaction-types';

/** Series metadata available independently of tooltip visibility. IDs last until series preparation changes. */
export interface ChartInteractionSeries<TType extends ChartSeries['type'] = ChartSeries['type']> {
    type: TType;
    id: string;
    name: string;
    custom?: MeaningfulAny;
}

/** Data represented by an entire line or filled shape, with its original source points. */
export interface ChartShapePoint<TPoint> {
    kind: 'shape';
    points: TPoint[];
}

/** Selected element data, preserving source point values; composite payloads are owned by the plugin. */
export type ChartInteractionItem<
    T = MeaningfulAny,
    TType extends ChartSeries['type'] = ChartSeries['type'],
> = Extract<BuiltInInteractionItem<T>, {series: {type: TType}}>;

/** Stable queries over the chart's current rendered data, available in event payloads. */
export interface ChartApi<T = MeaningfulAny> {
    /**
     * By default, select the nearest plugin reference position by Euclidean distance in plot-relative pixels.
     * In chart mode, ties follow prepared series order, then candidate order.
     * Tooltip mode preserves tooltip selection and layer priority. Use targets for exact contours.
     * Computes on request; returns null outside the plot or while no plot is available.
     * Results describe the data at query time. Later queries use the current chart state.
     */
    getClosest(
        position: [number, number],
        options?: ChartClosestOptions,
    ): ChartInteractionItem<T> | null;
}

export interface ChartClosestOptions {
    /**
     * - `'chart'`: Select the nearest reference position across all series, ignoring tooltip enablement.
     * - `'tooltip'`: Use the same selection and eligibility rules as the legacy click handler.
     * @default 'chart'
     */
    mode?: 'chart' | 'tooltip';
}

/** Complete modern event data emitted by the chart. Legacy wrappers may forward only part of it. */
export interface ChartClickData<T = MeaningfulAny> {
    /** Click coordinates in pixels relative to the main plot's top-left corner. */
    position: [number, number];
    /**
     * All exact hits, including covered elements, ordered from uppermost to lowest.
     * Computed synchronously on first access using current geometry, then cached for this payload.
     * Read inside the click handler before deferring work or updating the chart.
     */
    targets: ChartInteractionItem<T>[];
    /** Stable query API. Retained references use the current chart state. */
    chart: ChartApi<T>;
    /** Native click event. A tap produces the same payload as a mouse click. */
    event: MouseEvent;
}

// Mapping the modern fields preserves the indexability of the original inline callback payload.
/**
 * Compatible callback payload in both click modes. The chart supplies all modern fields;
 * they are optional here because legacy wrappers may forward only point and series.
 * Legacy selection may be absent in plot mode.
 */
export type ChartLegacyClickData<T = MeaningfulAny> = {
    [K in keyof ChartClickData<T>]?: ChartClickData<T>[K];
} & {
    /** @deprecated Use chart.getClosest(position, {mode: 'tooltip'})?.point, or targets for exact hits. */
    point: MeaningfulAny;
    /** @deprecated Use chart.getClosest(position, {mode: 'tooltip'})?.series, or targets for exact hits. */
    series: MeaningfulAny;
};
