import type {Dispatch} from 'd3-dispatch';
import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartInteractionItem,
    ChartInteractionSeries,
    ChartXAxis,
    ChartYAxis,
    CustomFormatContext,
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
import type {BasePreparedSeries, PreparedLegendOptions} from './types';

export type {AxisDomainValue, DomainAxis, DomainViewport, GetAxisDataArgs} from './axis-contract';

export interface SeriesPlugin<TTypes extends SeriesPluginTypes = SeriesPluginTypes> {
    /** Unique series type identifier, also used for CSS class generation. */
    type: TTypes['raw']['type'];
    series: SeriesPluginSeries<TTypes>;
    /** true enables scalar X/Y axes; omit or use false for series without axes. */
    axes?: boolean | SeriesPluginAxes<TTypes>;
    colorScale?: SeriesPluginColorScale<TTypes>;
    layers: SeriesPluginLayers<TTypes>;
    zoom?: SeriesPluginZoomOptions<
        TTypes['raw'] | TTypes['prepared'],
        TTypes['raw']['data'][number]
    >;
    interaction?: SeriesPluginInteraction<TTypes>;
    tooltip?: SeriesPluginTooltip<TTypes>;
}

export interface GetLayerKeyArgs<TSeries> {
    series: TSeries;
    /** Core-provided key for this occurrence: type/index for raw input, id for prepared input. */
    seriesKey: string;
}

export interface GetClipModeArgs {
    isRangeSlider: boolean;
    yAxis: readonly Pick<ChartYAxis, 'min' | 'max'>[];
    zoomState?: Readonly<Partial<ZoomState>>;
}

export type SeriesClipMode = 'bounds' | 'horizontal' | false;

export interface PluginSeries {
    type: string;
    data: unknown[];
}

export interface PluginTooltipChunk<TType extends string = string> {
    data: unknown;
    series: ChartInteractionSeries<TType>;
}

export interface PrepareSeriesArgs<T = PluginSeries, TOptions = object> {
    series: T[];
    /** Raw user options; preparation resolves its fallbacks from the plugin's own defaults. */
    seriesOptions?: TOptions;
    legend: PreparedLegendOptions;
    colorScale: ScaleOrdinal<string, string>;
    colors: string[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis[];
}

export interface PrepareLayerArgs<
    TSeries = BasePreparedSeries & {type: string},
    TOptions = object,
    TAllSeries = BasePreparedSeries & {type: string},
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
    otherLabelLayouts?: ShapeLabels[];
    /**
     * All visible series of the chart in config order, including the ones from other layers.
     * Every layer receives the same list, so a plugin can account for series outside its own layer.
     */
    allSeries?: TAllSeries[];
}

export interface PrepareLayerResult<
    TShape = object,
    TLookupItem = unknown,
> extends Partial<SeriesShapeData> {
    /** Private geometry; may be empty when this layer supplies other output. */
    renderData: TShape[];
    /** Explicit lookup payloads for tooltip/interaction; never inferred from renderData. */
    lookupItems?: TLookupItem[];
    /**
     * Groups reserved for placement in lower layers, passed through their `otherLabelLayouts`.
     * Preserve group metadata needed by cooperating plugins. This does not render the groups.
     */
    labelLayout?: ShapeLabels[];
    /** Reuse projected paint geometry as the full-series reference when the view is unfiltered. */
    gradientGeometry?: GradientGeometry[];
    /** Labels belonging to the whole plugin layer, independent of any one series. */
    svgLabels?: SvgLabel[];
}

export interface GetTooltipValueArgs<TTooltipChunk = PluginTooltipChunk> {
    item: TTooltipChunk;
    xAxis?: ChartXAxis | null;
    /** Y axis assigned to this item's series (defaults to axis 0). */
    yAxis?: ChartYAxis;
}

export interface SeriesPluginZoomOptions<TSeries = PluginSeries, TPoint = unknown> {
    /** Supported brush directions. */
    types: ZoomType[];
    /** Preferred direction when chart.zoom.type is omitted. */
    defaultType?: ZoomType;
    /** Omit for scalar point filtering; return original points separately from retained shape anchors. */
    filterData?(args: FilterSeriesDataArgs<TSeries>): SeriesDataSelection<TPoint>;
}

export interface RenderLayerArgs<TShape = object, TOptions = object> {
    /** SVG container for series geometry, such as lines, areas, bars, and sectors. */
    plot: SVGGElement;
    /** SVG container for labels above the layer's shapes and markers, clipped like `plot`. */
    labelsPlot: SVGGElement;
    /** May be empty for layers containing only core-rendered output or lookup data. */
    renderData: TShape[];
    svgLabels?: SvgLabel[];
    seriesOptions: TOptions;
    boundsWidth: number;
    boundsHeight: number;
    /** Existing hover-shape events drive hover styling; namespace listeners and remove them in cleanup. */
    dispatcher?: Dispatch<object>;
    /** Register asynchronous DOM work during layers.render; synchronous renderers can omit this. */
    registerCompletion?: (completion: Promise<void>) => void;
    /** Aborted when this preparation is superseded or its owner unmounts. */
    signal?: AbortSignal;
}

export interface ValidateSeriesArgs<
    T = PluginSeries,
    TOptions = object,
    TAllSeries = PluginSeries,
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
export interface SeriesPluginTypes {
    raw: PluginSeries;
    prepared: BasePreparedSeries & {type: string};
    shape: object;
    /** The plugin's series.options namespace(s), without unrelated built-in options. */
    options?: object;
    lookupItem?: unknown;
    tooltipChunk?: PluginTooltipChunk;
    formatContext?: CustomFormatContext;
    interaction?: ChartInteractionItem;
    /** Mixed-chart data is opaque beyond common metadata unless explicitly described. */
    allRaw?: PluginSeries;
    allPrepared?: BasePreparedSeries & {type: string};
}

type PluginTypeValue<T, K extends PropertyKey, Fallback> = T extends {[P in K]: infer V}
    ? V
    : Fallback;
type PluginOptions<T> = PluginTypeValue<T, 'options', object> & object;
type PluginLookup<T extends SeriesPluginTypes> = PluginTypeValue<T, 'lookupItem', T['shape']>;
type PluginChunk<T extends SeriesPluginTypes> = PluginTypeValue<
    T,
    'tooltipChunk',
    {data: T['raw']['data'][number]; series: T['prepared']}
> &
    PluginTooltipChunk<T['raw']['type']> & {series: T['prepared']};
type PluginInteraction<T extends SeriesPluginTypes> = PluginTypeValue<
    T,
    'interaction',
    ChartInteractionItem<T['raw']['data'][number] & object, T['raw']['type']>
> &
    ChartInteractionItem;
type PluginFormatContext<T> = PluginTypeValue<T, 'formatContext', CustomFormatContext> &
    CustomFormatContext;
type PluginAllRaw<T> = PluginTypeValue<T, 'allRaw', PluginSeries>;
type PluginAllPrepared<T> = PluginTypeValue<T, 'allPrepared', BasePreparedSeries & {type: string}>;
export interface SeriesPluginSeries<TTypes extends SeriesPluginTypes = SeriesPluginTypes> {
    /** Defaults for this plugin's namespace in series.options; user options are merged over them. */
    optionsDefaults?: PluginOptions<TTypes>[Extract<
        TTypes['raw']['type'],
        keyof PluginOptions<TTypes>
    >];

    /**
     * Validates type-specific series config. Called once per series by `validateData`.
     * Should throw a `ChartError` on invalid input. Omit for types that need no validation.
     */
    validate?(
        args: ValidateSeriesArgs<TTypes['raw'], PluginOptions<TTypes>, PluginAllRaw<TTypes>>,
    ): void;

    /**
     * Transforms raw config into prepared series with complete core metadata, even if legend is disabled.
     * Use prepareSeriesMetadata for common defaults. IDs must be chart-unique across all layers;
     * preserve explicit IDs and do not derive generated IDs from a layer-local array index.
     */
    prepare(
        args: PrepareSeriesArgs<TTypes['raw'], PluginOptions<TTypes>>,
    ):
        | (TTypes['prepared'] & {type: TTypes['raw']['type']})[]
        | Promise<(TTypes['prepared'] & {type: TTypes['raw']['type']})[]>;
}

export interface SeriesPluginAxes<
    TTypes extends SeriesPluginTypes = SeriesPluginTypes,
> extends SeriesAxes<TTypes['raw'] | TTypes['prepared']> {
    /** Two ordered axis-padding phases: initial label reserve, then projected paint extents. */
    padding?: SeriesAxisPadding<TTypes['prepared'], PluginOptions<TTypes>>;
}

export interface SeriesPluginColorScale<TTypes extends SeriesPluginTypes = SeriesPluginTypes> {
    /**
     * Returns the raw point value used for the color-scale domain.
     * `getDomainForContinuousColorScale` coerces the result to a number and builds the `[min, max]`
     * domain from it, over the raw series data (before shape data is prepared).
     * Omit colorScale for types without value-based coloring (e.g. treemap, sankey, radar).
     */
    getValue(data: TTypes['raw']['data'][number]): number | string | null | undefined;
}

export interface SeriesPluginLayers<TTypes extends SeriesPluginTypes = SeriesPluginTypes> {
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
    getKey?(args: GetLayerKeyArgs<TTypes['raw'] | TTypes['prepared']>): string;

    /**
     * Shape-group clipping: plot bounds by default, an expanded vertical region, or no clipping.
     * Does not control the separate marker, annotation, and HTML-label layers.
     */
    getClipMode?(args: GetClipModeArgs): SeriesClipMode;

    /**
     * Prepares a visible render layer after scales/padding. Called again for layout/data changes and
     * range-slider previews; use isRangeSlider to omit main-chart-only content. Do not rely on call counts.
     * All projection and lookup positions use main-plot pixels. getXValue/getYValue in shapes/utils
     * handle scalar/category coordinates; add the assigned split plot's top to projected Y.
     */
    prepareData(
        args: PrepareLayerArgs<
            TTypes['prepared'],
            PluginOptions<TTypes>,
            PluginAllPrepared<TTypes>
        >,
    ):
        | PrepareLayerResult<TTypes['shape'], PluginLookup<TTypes>>
        | Promise<PrepareLayerResult<TTypes['shape'], PluginLookup<TTypes>>>;

    /**
     * Full-series geometry for paints anchored before visible-range filtering. This can run separately
     * from main-layer preparation and be cached across viewport changes. Omit for solid paints.
     */
    prepareGradientGeometry?(
        args: PrepareLayerArgs<
            TTypes['prepared'],
            PluginOptions<TTypes>,
            PluginAllPrepared<TTypes>
        >,
    ): GradientGeometry[] | Promise<GradientGeometry[]>;

    /**
     * Renders into the supplied layer containers after preparation. Core calls cleanup before reusing
     * a container or unmounting. Keep synchronous geometry ready on return; register delayed work and
     * respect signal so stale work cannot write into a newer render. Core owns click/query listeners.
     */
    render(args: RenderLayerArgs<TTypes['shape'], PluginOptions<TTypes>>): (() => void) | void;
}

export interface SeriesPluginInteraction<TTypes extends SeriesPluginTypes = SeriesPluginTypes> {
    /** All eligible reference positions, without tooltip filtering or per-plugin selection. */
    prepareNearestData(
        args: PrepareNearestDataArgs<PluginLookup<TTypes>>,
    ): NearestCandidate<PluginInteraction<TTypes>>[];

    /** Enumerates series geometry and data, excluding labels, halos and connectors. */
    getTargetElements(
        args: InteractionElementsArgs<TTypes['shape']>,
    ): InteractionElement<PluginInteraction<TTypes>>[];

    /** Converts a selection containing multiple data parts into its public item. */
    getClosestItem?(item: PluginChunk<TTypes>): PluginInteraction<TTypes>;
}

export interface SeriesPluginTooltip<TTypes extends SeriesPluginTypes = SeriesPluginTypes> {
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
    prepareData: GetTooltipDataFn<PluginLookup<TTypes>, PluginChunk<TTypes>>;

    /**
     * Unformatted value used by built-in sorting and totals. Resolve category indices to names.
     * Omit to use the point's scalar value, or its Y value for axis-based points.
     */
    getValue?(args: GetTooltipValueArgs<PluginChunk<TTypes>>): AxisDomainValue;

    /** Omit for series without a tooltip header. */
    header?: SeriesPluginTooltipHeader<PluginChunk<TTypes>>;

    /**
     * Returns series-specific fields passed to a custom tooltip value formatter.
     * The shared tooltip renderer supplies `value`; plugins own all other context.
     */
    getValueFormatContext?(chunk: PluginChunk<TTypes>): Omit<PluginFormatContext<TTypes>, 'value'>;

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
        | ReadonlyArray<TooltipRowDef<PluginChunk<TTypes>>>
        | ((chunk: PluginChunk<TTypes>) => ReadonlyArray<TooltipRowDef<PluginChunk<TTypes>>>);
}

export interface SeriesPluginTooltipHeader<TChunk = unknown> {
    /** Unformatted header value, resolved once before applying headerFormat. */
    getValue(args: GetTooltipValueArgs<TChunk>): AxisDomainValue;
    /** Axis supplying this header's value and category formatting context. */
    axis?: 'x' | 'y';
    /** Require an explicit headerFormat before displaying this header. Defaults to false. */
    requiresFormat?: boolean;
    /** Higher priorities win in mixed tooltips; ties keep the first hovered chunk. Defaults to 0. */
    priority?: number;
}

export interface PluginTooltipRowCell<TTooltipChunk = PluginTooltipChunk> extends Omit<
    TooltipRowCellItem,
    'source'
> {
    source: string | ((args: {item: TTooltipChunk}) => unknown);
    /** Formats a plugin cell once using the resolved value format; not part of public tooltip.rows. */
    formatValue?(args: {item: TTooltipChunk; value: unknown; format?: ValueFormat}): string;
}

export interface TooltipRowDef<TTooltipChunk = PluginTooltipChunk> {
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
