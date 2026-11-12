import type {Dispatch} from 'd3-dispatch';
import type {ScaleOrdinal} from 'd3-scale';

import type {
    ChartInteractionItem,
    ChartSeries,
    ChartSeriesOptions,
    ChartXAxis,
    ChartYAxis,
    CustomFormatContext,
    MeaningfulAny,
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
    series: TSeries[];
    boundsWidth: number;
    boundsHeight: number;
    seriesOptions: TOptions;
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
    allSeries?: TAllSeries[];
}

export interface PrepareShapeDataResult<TShape = SeriesShapeData, TTooltipItem = unknown> {
    renderData: TShape[];
    /** Private lookup payloads. Core retains their plugin owner outside these objects. */
    tooltipItems: TTooltipItem[];
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

/** Associated pipeline types. Override these together to keep every plugin hook typed. */
export interface SeriesPluginData<TType extends string = string> {
    prepared: BasePreparedSeries & {type: TType};
    shape: SeriesShapeData;
    tooltipItem: unknown;
    interaction: ChartInteractionItem;
    options: object;
    preparedOptions: object;
    /** Mixed chart context is opaque unless the plugin knows the other registered types. */
    allRaw: PluginSeries;
    allPrepared: {type: string};
}

export interface SeriesPlugin<
    T extends PluginSeries = ChartSeries,
    TTooltipChunk extends PluginTooltipChunk = TooltipDataChunk,
    TFormatContext extends CustomFormatContext = CustomFormatContext,
    TData extends SeriesPluginData<T['type']> = {
        prepared: Extract<PreparedSeries, {type: T['type']}>;
        shape: MeaningfulAny;
        tooltipItem: MeaningfulAny;
        interaction: ChartInteractionItem;
        options: ChartSeriesOptions;
        preparedOptions: PreparedSeriesOptions;
        allRaw: ChartSeries;
        allPrepared: PreparedSeries;
    },
> {
    // --- Metadata ---

    /** Unique series type identifier (e.g. `'line'`, `'bar-x'`). Used for plugin lookup and CSS class generation. */
    type: T['type'];
    /** Defaults for this plugin's namespace in series.options; user options are merged over them. */
    defaults?: TData['options'][Extract<T['type'], keyof TData['options']>];
    /** true enables Cartesian axes with scalar defaults. Omit or use false for series without axes. */
    axes?: boolean | SeriesAxes<T | TData['prepared']>;
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
    getLayerKey?(args: GetLayerKeyArgs<T | TData['prepared']>): string;
    /**
     * Shape-group clipping: plot bounds by default, an expanded vertical region, or no clipping.
     * Does not control the separate marker, annotation, and HTML-label layers.
     */
    getClipPath?(args: GetClipPathArgs): SeriesClipPath;
    /** Supported zoom directions and point-filtering behavior. Omit to disable zoom. */
    zoom?: SeriesPluginZoomOptions<T | TData['prepared'], T['data'][number]>;

    // --- Validation ---

    /**
     * Validates type-specific series config. Called once per series by `validateData`.
     * Should throw a `ChartError` on invalid input. Omit for types that need no validation.
     */
    validate?(args: ValidateSeriesArgs<T, TData['options'], TData['allRaw']>): void;

    // --- Data preparation ---

    /**
     * Transforms raw config into prepared series with complete core metadata, even if legend is disabled.
     * Use prepareSeriesMetadata for common defaults. IDs must be chart-unique across all layers;
     * preserve explicit IDs and do not derive generated IDs from a layer-local array index.
     */
    prepareSeries(
        args: PrepareSeriesArgs<T, TData['options']>,
    ): TData['prepared'][] | Promise<TData['prepared'][]>;
    /** Two ordered axis-padding phases: initial label reserve, then projected paint extents. */
    axisPadding?: SeriesAxisPadding<TData['prepared'], TData['preparedOptions']>;
    /**
     * Returns the value of a data point that places it on a continuous color scale.
     * `getDomainForContinuousColorScale` coerces the result to a number and builds the `[min, max]`
     * domain from it, over the raw series data (before shape data is prepared).
     * Omit for types that do not support a continuous color scale (e.g. treemap, sankey, radar).
     */
    getColorValue?(data: T['data'][number]): number | string | null | undefined;
    /** Computes shape data (geometry, labels, markers) once per render. */
    prepareShapeData(
        args: PrepareShapeDataArgs<
            TData['prepared'],
            TData['preparedOptions'],
            TData['allPrepared']
        >,
    ):
        | PrepareShapeDataResult<TData['shape'], TData['tooltipItem']>
        | Promise<PrepareShapeDataResult<TData['shape'], TData['tooltipItem']>>;

    /** Full-series geometry for paints anchored before visible-range filtering. Omit for solid paints. */
    prepareGradientGeometry?(
        args: PrepareShapeDataArgs<
            TData['prepared'],
            TData['preparedOptions'],
            TData['allPrepared']
        >,
    ): GradientGeometry[] | Promise<GradientGeometry[]>;

    // --- Rendering ---

    /** Renders shapes into `plot` and labels into `labelsPlot`. May return a cleanup function. */
    renderShapes(
        args: RenderShapesArgs<TData['shape'], TData['preparedOptions']>,
    ): (() => void) | void;

    // --- Interaction ---

    interaction?: {
        /** All eligible reference positions, without tooltip filtering or per-plugin selection. */
        prepareNearestData(
            args: PrepareNearestDataArgs<TData['tooltipItem']>,
        ): NearestCandidate<TData['interaction']>[];
        /** Enumerates series geometry and data, excluding labels, halos and connectors. */
        getTargetElements(
            args: InteractionElementsArgs<TData['shape']>,
        ): InteractionElement<TData['interaction']>[];
        /** Converts a selection containing multiple data parts into its public item. */
        getClosestItem?(item: TTooltipChunk): TData['interaction'];
    };

    // --- Tooltip ---

    tooltip: {
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
        prepareData: GetTooltipDataFn<TData['tooltipItem'], TTooltipChunk>;
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
         * Each entry maps to one rendered `<tr>`. Explicit `tooltip.rows` replaces this list.
         */
        rows:
            | ReadonlyArray<TooltipRowDef<TTooltipChunk>>
            | ((chunk: TTooltipChunk) => ReadonlyArray<TooltipRowDef<TTooltipChunk>>);
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
