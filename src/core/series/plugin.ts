import type {Dispatch} from 'd3-dispatch';
import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartSeries,
    ChartSeriesOptions,
    ChartXAxis,
    ChartYAxis,
    CustomFormatContext,
    TooltipDataChunk,
    TooltipRowCellItem,
    ValueFormat,
} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {ZoomType} from '../constants';
import type {PreparedSplit} from '../layout/split-types';
import type {ChartScale} from '../scales/types';
import type {SeriesShapeData, ShapeLabels, SvgLabel, TooltipItemData} from '../shapes/types';
import type {GradientGeometry} from '../utils/gradient-reference';
import type {GetTooltipDataFn} from '../utils/tooltip-helpers';
import type {ZoomState} from '../zoom/types';

import type {PreparedLegendOptions, PreparedSeries, PreparedSeriesOptions} from './types';

export type AxisDomainValue = number | string | null | undefined;

export interface SeriesLayer<TSeries> {
    key: string;
    series: readonly TSeries[];
}

export interface GetLayersArgs<TSeries> {
    series: readonly TSeries[];
    /** Existing raw/prepared key for an item at its index in this plugin's input. */
    getSeriesKey(series: TSeries, index: number): string;
}

export interface SeriesClipPathArgs {
    isRangeSlider: boolean;
    yAxis: readonly PreparedYAxis[];
    zoomState?: Readonly<Partial<ZoomState>>;
}

export interface SeriesAxisDomainValues<T extends ChartSeries> {
    x?(data: T['data'][number]): AxisDomainValue | AxisDomainValue[];
    y?(data: T['data'][number]): AxisDomainValue | AxisDomainValue[];
}

export interface PrepareSeriesArgs<T = ChartSeries> {
    series: T[];
    seriesOptions?: ChartSeriesOptions;
    legend: PreparedLegendOptions;
    colorScale: ScaleOrdinal<string, string>;
    colors: string[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
}

export interface PrepareShapeDataArgs {
    series: PreparedSeries[];
    boundsWidth: number;
    boundsHeight: number;
    seriesOptions: PreparedSeriesOptions;
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    split?: PreparedSplit;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers?: ShapeLabels[];
    /**
     * All visible series of the chart in config order, including the ones from other layers.
     * Every layer receives the same list, so a plugin can account for series outside its own layer.
     */
    allSeries?: PreparedSeries[];
}

export interface PrepareShapeDataResult {
    renderData: SeriesShapeData[];
    tooltipItems: TooltipItemData[];
    /** Reuse projected paint geometry as the full-series reference when the view is unfiltered. */
    gradientGeometry?: GradientGeometry[];
    /** Labels belonging to the whole plugin layer, independent of any one series. */
    labels?: SvgLabel[];
}

export interface GetTooltipValueArgs<TTooltipChunk extends TooltipDataChunk = TooltipDataChunk> {
    item: TTooltipChunk;
    xAxis?: ChartXAxis | null;
    /** Y axis assigned to this item's series (defaults to axis 0). */
    yAxis?: ChartYAxis;
}

export interface SeriesPluginZoomOptions<T extends ChartSeries = ChartSeries> {
    /** Supported brush directions. */
    types: ZoomType[];
    /** Preferred direction when chart.zoom.type is omitted. */
    defaultType?: ZoomType;
    /** Keep neighboring shape points during filtering on continuous X axes; ignored for category X axes. */
    preserveAdjacentPoints?: boolean;
    /** Overrides the scalar Y check, for example to test interval overlap. */
    isYInRange?(data: T['data'][number], range: [number, number]): boolean;
}

export interface RenderShapesArgs {
    plot: SVGGElement;
    preparedData: SeriesShapeData[];
    labels?: SvgLabel[];
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    dispatcher?: Dispatch<object>;
}

export interface ValidateSeriesArgs<T = ChartSeries> {
    /** The series being validated. */
    series: T;
    /** All series in the chart. Needed only by collection-level checks (e.g. treemap uniqueness); other types ignore it. */
    allSeries: ChartSeries[];
    seriesOptions?: ChartSeriesOptions;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
}

export interface SeriesPlugin<
    T extends ChartSeries = ChartSeries,
    TTooltipChunk extends TooltipDataChunk = TooltipDataChunk,
    TFormatContext extends CustomFormatContext = CustomFormatContext,
> {
    // --- Metadata ---

    /** Unique series type identifier (e.g. `'line'`, `'bar-x'`). Used for plugin lookup and CSS class generation. */
    type: T['type'];
    /**
     * Partitions this plugin's raw/prepared series into nonempty layers, retaining each input once.
     * Preserve member order and use stable, chart-unique keys. Core orders layers by their first member.
     * TODO: Support line1 / [bar1.1 + bar1.2 stack] / line2 / bar2 by separating shared bar
     * geometry from render-layer partitioning, retaining source order, and defining placement
     * for groups whose members straddle other layers. Built-in bars still use one layer per type.
     */
    getLayers<TSeries extends ChartSeries | PreparedSeries>(
        args: GetLayersArgs<TSeries>,
    ): readonly SeriesLayer<TSeries>[];
    /**
     * Shape-group clipping: plot bounds by default, an expanded vertical region, or no clipping.
     * Does not control the separate marker, annotation, and HTML-label layers.
     */
    getClipPath?(args: SeriesClipPathArgs): 'bounds' | 'horizontal' | false;
    /** Supported zoom directions and point-filtering behavior. Omit to disable zoom. */
    zoom?: SeriesPluginZoomOptions<T>;

    // --- Validation ---

    /**
     * Validates type-specific series config. Called once per series by `validateData`.
     * Should throw a `ChartError` on invalid input. Omit for types that need no validation.
     */
    validate?(args: ValidateSeriesArgs<T>): void;

    // --- Data preparation ---

    /** Transforms raw chart series config into prepared series objects used throughout the render pipeline. */
    prepareSeries(args: PrepareSeriesArgs): PreparedSeries[] | Promise<PreparedSeries[]>;
    /**
     * Returns the value of a data point that places it on a continuous color scale.
     * `getDomainForContinuousColorScale` coerces the result to a number and builds the `[min, max]`
     * domain from it, over the raw series data (before shape data is prepared).
     * Omit for types that do not support a continuous color scale (e.g. treemap, sankey, radar).
     */
    getColorValue?(data: T['data'][number]): number | string | null | undefined;
    /** Axis-domain contributions for a point; return [] to exclude it. Omitted axes use the default extraction. */
    getAxisDomainValues?: SeriesAxisDomainValues<T>;
    /** Computes shape data (geometry, labels, markers) once per render. */
    prepareShapeData(
        args: PrepareShapeDataArgs,
    ): PrepareShapeDataResult | Promise<PrepareShapeDataResult>;

    /** Full-series geometry for paints anchored before visible-range filtering. Omit for solid paints. */
    prepareGradientGeometry?(
        args: PrepareShapeDataArgs,
    ): GradientGeometry[] | Promise<GradientGeometry[]>;

    // --- Rendering ---

    /** Renders shapes into the provided SVG `<g>` element using D3. May return a cleanup function. */
    renderShapes(args: RenderShapesArgs): (() => void) | void;

    // --- Tooltip ---

    tooltip: {
        /** Returns tooltip data for a given pointer position and prepared series. */
        prepareData: GetTooltipDataFn;
        /**
         * Unformatted value used by built-in sorting and totals. Resolve category indices to names.
         * Omit to use the point's scalar value, or its Y value for axis-based points.
         */
        getValue?(args: GetTooltipValueArgs<TTooltipChunk>): AxisDomainValue;
        /** Omit for series without a tooltip header. */
        header?: {
            /** Unformatted header value, resolved once before applying headerFormat. */
            getValue(args: GetTooltipValueArgs<TTooltipChunk>): AxisDomainValue;
            /** Axis supplying this header's value and category formatting context. */
            axis?: 'x' | 'y';
            /** Require an explicit headerFormat before displaying this header. Defaults to false. */
            requiresFormat?: boolean;
            /** Higher priorities win in mixed tooltips; ties keep the first hovered chunk. Defaults to 0. */
            priority?: number;
        };
        /**
         * Returns series-specific fields passed to a custom tooltip value formatter.
         * The shared tooltip renderer supplies `value`; plugins own all other context.
         */
        getValueFormatContext?(chunk: TTooltipChunk): Omit<TFormatContext, 'value'>;
        /**
         * Default tooltip row definitions for each data chunk.
         *
         * - Static array: every chunk renders the same set of rows.
         * - Function: called per chunk, allowing conditional extra rows
         *   (e.g. waterfall adds a "Subtotal" row for non-total bars).
         *
         * Each entry maps to one rendered `<tr>`. The first entry is the *primary* row
         * and is the only one that respects user overrides (`row.cells.items` /
         * `row.renderer`). Extra entries are always rendered with the plugin's cells.
         */
        rows:
            | ReadonlyArray<TooltipRowDef>
            | ((chunk: TooltipDataChunk) => ReadonlyArray<TooltipRowDef>);
    };
}

export interface PluginTooltipRowCell extends TooltipRowCellItem {
    /** Formats a plugin cell once using the resolved value format; not part of public tooltip.rows. */
    formatValue?(args: {item: TooltipDataChunk; value: unknown; format?: ValueFormat}): string;
}

export interface TooltipRowDef {
    /** Unique identifier within one chunk's row list. Used as part of the React key. */
    id: string;
    cells: ReadonlyArray<PluginTooltipRowCell>;
}
