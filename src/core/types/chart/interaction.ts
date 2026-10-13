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

/** Data represented by an entire line or filled shape, rather than one of its vertices. */
export interface ChartShapePoint<TPoint> {
    kind: 'shape';
    points: TPoint[];
}

/** Selected element data, with a payload owned by its series plugin. */
export type ChartInteractionItem<
    T = MeaningfulAny,
    TType extends ChartSeries['type'] = ChartSeries['type'],
> = Extract<BuiltInInteractionItem<T>, {series: {type: TType}}>;

/** Stable public queries over the chart's current rendered data. Also available through ChartRef. */
export interface ChartApi<T = MeaningfulAny> {
    /**
     * Select the nearest plugin reference position by Euclidean distance in plot-relative pixels.
     * Ties follow series/layer order, then candidate order. Exact contours are queried via targets.
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
     * - `'chart'`: Select the nearest reference position across all series, ignoring tooltip enablement (default).
     * - `'tooltip'`: Use the same selection and eligibility rules as the legacy click handler.
     */
    mode?: 'chart' | 'tooltip';
}

export interface ChartClickData<T = MeaningfulAny> {
    /** Click coordinates in pixels relative to the main plot's top-left corner. */
    position: [number, number];
    /** All exact hits, including covered elements, ordered from uppermost to lowest. */
    targets: ChartInteractionItem<T>[];
    /** The same stable public API exposed through the component ref. */
    chart: ChartApi<T>;
    /** Native click event. A tap produces the same payload as a mouse click. */
    event: MouseEvent;
    /** @deprecated Use chart.getClosest(position, {mode: 'tooltip'})?.point, or targets for exact hits. */
    point: MeaningfulAny;
    /** @deprecated Use chart.getClosest(position, {mode: 'tooltip'})?.series, or targets for exact hits. */
    series: MeaningfulAny;
}
