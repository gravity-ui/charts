import type {Dispatch} from 'd3-dispatch';
import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartInteractionItem,
    ChartSeries,
    ChartSeriesOptions,
    ChartXAxis,
    ChartYAxis,
    CustomFormatContext,
    TooltipDataChunk,
    TooltipRowCellItem,
    ValueFormat,
} from '~core/types';

import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {ZoomType} from '../constants';
import type {PreparedSplit} from '../layout/split-types';
import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '../scales/axis-padding';
import type {ChartScale} from '../scales/types';
import type {SeriesShapeData, ShapeLabels, SvgLabel} from '../shapes/types';
import type {InteractionElement, InteractionElementsArgs} from '../utils/chart-interaction';
import type {GradientGeometry} from '../utils/gradient-reference';
import type {NearestCandidate, PrepareNearestDataArgs} from '../utils/nearest-point';
import type {GetTooltipDataFn} from '../utils/tooltip-helpers';
import type {FilterSeriesDataArgs, SeriesDataSelection} from '../zoom/filter-data';
import type {ZoomState} from '../zoom/types';

import type {AxisDomainValue, SeriesAxes} from './axis-contract';
import type {
    BasePreparedSeries,
    PreparedLegendOptions,
    PreparedSeries,
    PreparedSeriesOptions,
} from './types';

export type {AxisDomainValue, DomainAxis, DomainViewport, GetAxisDataArgs} from './axis-contract';

export interface GetLayerKeyArgs<TSeries> {
    series: TSeries;
    /** Core-provided key for this occurrence: type/index for raw input, id for prepared input. */
    seriesKey: string;
}

export interface GetClipPathArgs {
    isRangeSlider: boolean;
    yAxis: readonly Pick<ChartYAxis, 'min' | 'max'>[];
    zoomState?: Readonly<Partial<ZoomState>>;
}

export type SeriesClipPath = 'bounds' | 'horizontal' | false;

export interface PluginSeries {
    type: string;
    data: unknown[];
}

export interface PluginTooltipChunk {
    data: unknown;
    series: {type: string};
}

export interface PrepareSeriesArgs<T = ChartSeries, TOptions = ChartSeriesOptions> {
    series: T[];
    /** Raw user options; preparation resolves its fallbacks from the plugin's own defaults. */
    seriesOptions?: TOptions;
    legend: PreparedLegendOptions;
    colorScale: ScaleOrdinal<string, string>;
    colors: string[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
}

export interface PrepareShapeDataArgs<
    TSeries = PreparedSeries,
    TOptions = PreparedSeriesOptions,
    TAllSeries = PreparedSeries,
> {
    /** Visible members of this layer, in config order. Core prepares upper layers first. */
    series: TSeries[];
    /** Plot-relative pixels. Core skips main shape preparation when either dimension is nonpositive. */
    boundsWidth: number;
    boundsHeight: number;
    /** Plugin defaults merged with user series.options; the type conservatively describes its config. */
    seriesOptions: TOptions;
    /** Absent on charts without Cartesian axes; axis-free plugins can ignore these inputs. */
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis[];
    xScale?: ChartScale;
    /** Indexed like yAxis. Use the series' Y-axis index (0 by default), not its layer index. */
    yScale?: (ChartScale | undefined)[];
    /** Y scales are split-local: add plots[yAxis[index].plotIndex].top once for main-plot coordinates. */
    split?: PreparedSplit;
    isOutsideBounds?: (x: number, y: number) => boolean;
    isRangeSlider?: boolean;
    otherLayers?: ShapeLabels[];
    /**
     * All visible series of the chart in config order, including the ones from other layers.
     * Every layer receives the same list, so a plugin can account for series outside its own layer.
     */
    allSeries?: TAllSeries[];
}

export interface PrepareShapeDataResult<
    TShape = SeriesShapeData,
    TTooltipItem = unknown,
> extends Partial<SeriesShapeData> {
    renderData: TShape[];
    /** Private lookup payloads for tooltip/interaction adapters. Core retains their owner separately. */
    tooltipItems?: TTooltipItem[];
    /**
     * Groups reserved for placement in lower layers, passed through their `otherLayers`.
     * Preserve group metadata needed by cooperating plugins. This does not render the groups.
     */
    layoutData?: ShapeLabels[];
    /** Reuse projected paint geometry as the full-series reference when the view is unfiltered. */
    gradientGeometry?: GradientGeometry[];
    /** Labels belonging to the whole plugin layer, independent of any one series. */
    labels?: SvgLabel[];
}

export interface GetTooltipValueArgs<TTooltipChunk = TooltipDataChunk> {
    item: TTooltipChunk;
    xAxis?: ChartXAxis | null;
    /** Y axis assigned to this item's series (defaults to axis 0). */
    yAxis?: ChartYAxis;
}

export interface SeriesPluginZoomOptions<TSeries = ChartSeries, TPoint = unknown> {
    /** Supported brush directions. */
    types: ZoomType[];
    /** Preferred direction when chart.zoom.type is omitted. */
    defaultType?: ZoomType;
    /** Omit for scalar point filtering; return original points separately from retained shape anchors. */
    filterData?(args: FilterSeriesDataArgs<TSeries>): SeriesDataSelection<TPoint>;
}

export interface RenderShapesArgs<TShape = SeriesShapeData, TOptions = PreparedSeriesOptions> {
    /** SVG container for series geometry, such as lines, areas, bars, and sectors. */
    plot: SVGGElement;
    /** SVG container for labels above the layer's shapes and markers, clipped like `plot`. */
    labelsPlot: SVGGElement;
    preparedData: TShape[];
    labels?: SvgLabel[];
    seriesOptions: TOptions;
    boundsWidth: number;
    boundsHeight: number;
    /** Existing hover-shape events drive hover styling; namespace listeners and remove them in cleanup. */
    dispatcher?: Dispatch<object>;
    /** Register asynchronous DOM work during renderShapes; synchronous renderers can omit this. */
    registerCompletion?: (completion: Promise<void>) => void;
    /** Aborted when this preparation is superseded or its owner unmounts. */
    signal?: AbortSignal;
}

export interface ValidateSeriesArgs<
    T = ChartSeries,
    TOptions = ChartSeriesOptions,
    TAllSeries = ChartSeries,
> {
    /** The series being validated. */
    series: T;
    /** All series in the chart. Needed only by collection-level checks (e.g. treemap uniqueness); other types ignore it. */
    allSeries: TAllSeries[];
    seriesOptions?: TOptions;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
}

/** Plugin-owned pipeline types. Only raw data, prepared data and geometry are mandatory. */
export interface SeriesPluginData {
    raw: PluginSeries;
    prepared: BasePreparedSeries & {type: string};
    shape: object;
    /** The plugin's series.options namespace(s), without unrelated built-in options. */
    options?: object;
    tooltipItem?: unknown;
    tooltipChunk?: PluginTooltipChunk;
    formatContext?: CustomFormatContext;
    interaction?: ChartInteractionItem;
    /** Mixed-chart data is opaque beyond common metadata unless explicitly described. */
    allRaw?: PluginSeries;
    allPrepared?: BasePreparedSeries & {type: string};
}

type PluginDataValue<T, K extends PropertyKey, Fallback> = T extends {[P in K]: infer V}
    ? V
    : Fallback;
type PluginOptions<T> = PluginDataValue<T, 'options', object> & object;
type PluginLookup<T extends SeriesPluginData> = PluginDataValue<T, 'tooltipItem', T['shape']>;
type PluginChunk<T extends SeriesPluginData> = PluginDataValue<
    T,
    'tooltipChunk',
    {data: T['raw']['data'][number]; series: T['prepared']}
> &
    PluginTooltipChunk;
type PluginInteraction<T extends SeriesPluginData> = PluginDataValue<
    T,
    'interaction',
    ChartInteractionItem<Extract<T['raw']['data'][number], object>, T['raw']['type']>
> &
    ChartInteractionItem;
type PluginFormatContext<T> = PluginDataValue<T, 'formatContext', CustomFormatContext> &
    CustomFormatContext;
type PluginAllRaw<T> = PluginDataValue<T, 'allRaw', PluginSeries>;
type PluginAllPrepared<T> = PluginDataValue<T, 'allPrepared', BasePreparedSeries & {type: string}>;

export interface SeriesPlugin<TData extends SeriesPluginData = SeriesPluginData> {
    // --- Metadata ---

    /** Unique series type identifier (e.g. `'line'`, `'bar-x'`). Used for plugin lookup and CSS class generation. */
    type: TData['raw']['type'];
    /** Defaults for this plugin's namespace in series.options; user options are merged over them. */
    defaults?: PluginOptions<TData>[Extract<TData['raw']['type'], keyof PluginOptions<TData>>];
    /** true enables Cartesian axes with scalar defaults. Omit or use false for series without axes. */
    axes?: boolean | SeriesAxes<TData['raw'] | TData['prepared']>;
    /**
     * Selects the layer for one raw/prepared series occurrence. Equal keys share a layer.
     * Omit to use series.type: all series of this plugin share one layer by default.
     * Use stable, chart-unique layer keys; core rejects keys shared by different types.
     * Return seriesKey for an independent layer.
     * Core preserves member order and orders layers by their first occurrence.
     * TODO: Support line1 / [bar1.1 + bar1.2 stack] / line2 / bar2 by separating shared bar
     * geometry from render-layer partitioning, retaining source order, and defining placement
     * for groups whose members straddle other layers. Built-in bars still use one layer per type.
     */
    getLayerKey?(args: GetLayerKeyArgs<TData['raw'] | TData['prepared']>): string;
    /**
     * Shape-group clipping: plot bounds by default, an expanded vertical region, or no clipping.
     * Does not control the separate marker, annotation, and HTML-label layers.
     */
    getClipPath?(args: GetClipPathArgs): SeriesClipPath;
    /** Supported zoom directions and point-filtering behavior. Omit to disable zoom. */
    zoom?: SeriesPluginZoomOptions<TData['raw'] | TData['prepared'], TData['raw']['data'][number]>;

    // --- Validation ---

    /**
     * Validates type-specific series config. Called once per series by `validateData`.
     * Should throw a `ChartError` on invalid input. Omit for types that need no validation.
     */
    validate?(
        args: ValidateSeriesArgs<TData['raw'], PluginOptions<TData>, PluginAllRaw<TData>>,
    ): void;

    // --- Data preparation ---

    /**
     * Transforms raw config into prepared series with complete core metadata, even if legend is disabled.
     * Use prepareSeriesMetadata for common defaults. IDs must be chart-unique across all layers;
     * preserve explicit IDs and do not derive generated IDs from a layer-local array index.
     */
    prepareSeries(
        args: PrepareSeriesArgs<TData['raw'], PluginOptions<TData>>,
    ):
        | (TData['prepared'] & {type: TData['raw']['type']})[]
        | Promise<(TData['prepared'] & {type: TData['raw']['type']})[]>;
    /** Two ordered axis-padding phases: initial label reserve, then projected paint extents. */
    axisPadding?: SeriesAxisPadding<TData['prepared'], PluginOptions<TData>>;
    /**
     * Returns the value of a data point that places it on a continuous color scale.
     * `getDomainForContinuousColorScale` coerces the result to a number and builds the `[min, max]`
     * domain from it, over the raw series data (before shape data is prepared).
     * Omit for types that do not support a continuous color scale (e.g. treemap, sankey, radar).
     */
    getColorValue?(data: TData['raw']['data'][number]): number | string | null | undefined;
    /**
     * Prepares a visible render layer after scales/padding. Called again for layout/data changes and
     * range-slider previews; use isRangeSlider to omit main-chart-only content. Do not rely on call counts.
     * All projection and lookup positions use main-plot pixels. getXValue/getYValue in shapes/utils
     * handle scalar/category coordinates; add the assigned split plot's top to projected Y.
     */
    prepareShapeData(
        args: PrepareShapeDataArgs<
            TData['prepared'],
            PluginOptions<TData>,
            PluginAllPrepared<TData>
        >,
    ):
        | PrepareShapeDataResult<TData['shape'], PluginLookup<TData>>
        | Promise<PrepareShapeDataResult<TData['shape'], PluginLookup<TData>>>;

    /**
     * Full-series geometry for paints anchored before visible-range filtering. This can run separately
     * from main-layer preparation and be cached across viewport changes. Omit for solid paints.
     */
    prepareGradientGeometry?(
        args: PrepareShapeDataArgs<
            TData['prepared'],
            PluginOptions<TData>,
            PluginAllPrepared<TData>
        >,
    ): GradientGeometry[] | Promise<GradientGeometry[]>;

    // --- Rendering ---

    /**
     * Renders into the supplied layer containers after preparation. Core calls cleanup before reusing
     * a container or unmounting. Keep synchronous geometry ready on return; register delayed work and
     * respect signal so stale work cannot write into a newer render. Core owns click/query listeners.
     */
    renderShapes(args: RenderShapesArgs<TData['shape'], PluginOptions<TData>>): (() => void) | void;

    // --- Interaction ---

    interaction?: {
        /** All eligible reference positions, without tooltip filtering or per-plugin selection. */
        prepareNearestData(
            args: PrepareNearestDataArgs<PluginLookup<TData>>,
        ): NearestCandidate<PluginInteraction<TData>>[];
        /** Enumerates series geometry and data, excluding labels, halos and connectors. */
        getTargetElements(
            args: InteractionElementsArgs<TData['shape']>,
        ): InteractionElement<PluginInteraction<TData>>[];
        /** Converts a selection containing multiple data parts into its public item. */
        getClosestItem?(item: PluginChunk<TData>): PluginInteraction<TData>;
    };

    // --- Tooltip ---

    tooltip?: {
        /**
         * Returns tooltip data for a given pointer position and prepared series.
         * Return either selected chunks or X-aligned lookup points, never both. Multiple
         * chunks/rows are supported within the selected strategy; core does not deduplicate them.
         * When `measureDistance` is `true`, the `closest` chunk and every lookup point must set
         * `distance`: the pixel distance from the pointer to the drawn shape of its series, `0`
         * when the pointer is inside it. In mixed charts only the `closest` chunk with the
         * smallest distance stays `closest`. When `measureDistance` is `false`, the distance
         * is not compared: skip measuring it unless the plugin needs the measurement to pick its
         * own candidate (scatter does); a constant `0` of hit-test plugins is fine.
         */
        prepareData: GetTooltipDataFn<PluginLookup<TData>, PluginChunk<TData>>;
        /**
         * Unformatted value used by built-in sorting and totals. Resolve category indices to names.
         * Omit to use the point's scalar value, or its Y value for axis-based points.
         */
        getValue?(args: GetTooltipValueArgs<PluginChunk<TData>>): AxisDomainValue;
        /** Omit for series without a tooltip header. */
        header?: {
            /** Unformatted header value, resolved once before applying headerFormat. */
            getValue(args: GetTooltipValueArgs<PluginChunk<TData>>): AxisDomainValue;
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
        getValueFormatContext?(
            chunk: PluginChunk<TData>,
        ): Omit<PluginFormatContext<TData>, 'value'>;
        /**
         * Default tooltip row definitions for each data chunk.
         *
         * - Static array: every chunk renders the same set of rows.
         * - Function: called per chunk, allowing conditional extra rows
         *   (e.g. waterfall adds a "Subtotal" row for non-total bars).
         *
         * Each entry maps to one rendered `<tr>`. Explicit `tooltip.rows` replaces this list.
         */
        rows:
            | ReadonlyArray<TooltipRowDef<PluginChunk<TData>>>
            | ((chunk: PluginChunk<TData>) => ReadonlyArray<TooltipRowDef<PluginChunk<TData>>>);
    };
}

export interface PluginTooltipRowCell<TTooltipChunk = TooltipDataChunk> extends Omit<
    TooltipRowCellItem,
    'source'
> {
    source: string | ((args: {item: TTooltipChunk}) => unknown);
    /** Formats a plugin cell once using the resolved value format; not part of public tooltip.rows. */
    formatValue?(args: {item: TTooltipChunk; value: unknown; format?: ValueFormat}): string;
}

export interface TooltipRowDef<TTooltipChunk = TooltipDataChunk> {
    /** Unique identifier within one chunk's row list. Used as part of the React key. */
    id: string;
    cells: ReadonlyArray<PluginTooltipRowCell<TTooltipChunk>>;
}

/** Padding is measured in plot-local pixels; both phases precede shape preparation. */
export interface SeriesAxisPadding<TSeries, TOptions> {
    /**
     * Label-space reserve at the maximum X domain end, before tick rounding and paint fitting.
     * Core takes the maximum nonnegative request across its visibility-selected prepared series.
     * Configured max bounds suppress it outside zoom; fixed plugin domains always suppress it.
     * Zoom and slider scale building retain this reserve.
     */
    getXDomainReserve?(series: TSeries): number;
    /**
     * Paint centers and extents projected once on the initial scales, after domain reserves.
     * Called only for visible series when an unconstrained continuous edge uses padding: 'auto'.
     * All plugins measure against the same scales; core then fits each free edge independently.
     * Explicit bounds, zoom/slider bounds and fixed domains remain authoritative.
     */
    getPaintExtents?(args: PrepareAxisPaddingArgs<TSeries, TOptions>): AxisPaddingPoint[];
}
